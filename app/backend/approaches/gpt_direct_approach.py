# Copyright (c) Microsoft Corporation.
# Licensed under the MIT license.

import json
import re
import logging
import urllib.parse
from datetime import datetime, timedelta
from typing import Any, Sequence

import openai
from openai import AzureOpenAI, BadRequestError
from openai import AsyncAzureOpenAI
from approaches.approach import Approach

from text import nonewlines
from datetime import datetime, timedelta

from text import nonewlines

from core.messagebuilder import MessageBuilder
from core.modelhelper import get_token_limit
from core.modelhelper import num_tokens_from_messages
import requests
from urllib.parse import quote


# Simple retrieve-then-read implementation, using the Cognitive Search and
# OpenAI APIs directly. It first retrieves top documents from search,
# then constructs a prompt with them, and then uses OpenAI to generate
# an completion (answer) with that prompt.

class GPTDirectApproach(Approach):

       # Chat roles
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
     
    system_message_chat_conversation = """
    You are an Azure OpenAI Completion system for Health and Human Services.  Your persona is Professional Researcher Assistant who helps answer questions about Health and Human Services research, reporting, written communications, and problem solving.
	User persona is Professional Analyst, answer ONLY with the facts listed in the sources below in the specified language for the query term, with citations. If there isn't enough information, say you don't know and do not give citations. For tabular information return it as an html table.  Do not return markdown format.
	Your Goal:
	As a Professional Research Assistant, your role is to assist with the project. This includes sourcing, writing, and proofreading data from provided documents, web searches, or RAG (Retrieval-Augmented Generation). 
    Your tasks are:
	1.	Writing: Produce summaries, write-ups, commentaries, reports, and articles based on the facts. Include citations where necessary.
	2.	Proofreading: Check and correct errors in grammar, spelling, punctuation, facts, and syntax.
	3.	Improving Readability: Provide suggestions to enhance clarity, coherence, and overall readability. Adhere to English grammar and usage rules.
	4.	Clarification: If you encounter ambiguous or unclear information, ask for clarification instead of making assumptions.
	5.	Verification: Verify the accuracy of any mentioned sites.
    6.  BIAS: Identify any biases in the provided text, including language, assumptions, and perspectives. Highlight specific instances and explain why they might be considered biased.
	7.	Goal: Help me produce polished and error-free documents. If the provided information is insufficient, ask for more details instead of making assumptions or providing speculative information.    
        
        {follow_up_questions_prompt}
        {injected_prompt}
        
        """
    follow_up_questions_prompt_content = """
        Generate three very brief follow-up questions that the user would likely ask next about their previous chat context. Use triple angle brackets to reference the questions, e.g. <<<What is the main theme of the source documents?>>>. Try not to repeat questions that have already been asked.
        Only generate questions and do not generate any text before or after the questions, such as 'Next Questions'
        """
    
    query_prompt_template = """Below is a history of the conversation so far, and a new question asked by the user that needs to be answered.
        Generate a search query based on the conversation and the new question. Treat each search term as an individual keyword. Do not combine terms in quotes or brackets.
        Do not include cited sources e.g info or doc in the search query terms.
        Do not include any text inside [] or <<<>>> in the search query terms.
        Do not include any special characters like '+'.
        If the question is not in {query_term_language}, translate the question to {query_term_language} before generating the search query.
        If you cannot generate a search query, return just the number 0.
        """

    #Few Shot prompting for Keyword Search Query
    query_prompt_few_shots = [
        {'role' : USER, 'content' : 'What are the key factors of the data we are researching? Can we ask, What would happen if?' },
        {'role' : ASSISTANT, 'content' : 'Absolutely, understanding the key factors of the data we are researching is crucial. It helps us identify the variables that have the most impact on our analysis. As for your question, "What would happen if?", it\'s a great way to explore hypothetical scenarios and understand potential outcomes.' },
        {'role' : USER, 'content' : 'How does a narrative report compare to a data-driven report in terms of reader engagement?' },
        {'role' : ASSISTANT, 'content' : 'I\'ll find a comparison between narrative and data-driven reports in terms of reader engagement.' },
        {'role' : USER, 'content' : 'Using the source documents, what trends are identifiable?",' },
        {'role' : ASSISTANT, 'content' : 'Sure, I can assist with that. Please specify the objective of the analysis, the timeframe, and any notable points to consider?"' }
        ]

    #Few Shot prompting for Response. This will feed into Chain of thought system message.
    response_prompt_few_shots = [
        {'role': USER, 'content': 'I need clarification on this topic. Can you provide a comprehensive breakdown?'},

        {'role': ASSISTANT, 'content': 'Sure, I’d be happy to help. Here’s a detailed explanation of the topic: [Insert comprehensive breakdown here]. This includes the main concepts, key terms, and relevant examples to provide a full understanding.'},

        {'role': USER, 'content': 'What key factors are represented? Are any external factors noted?'},

        {'role': ASSISTANT, 'content': 'The key factors represented include [insert key factors here]. Additionally, external factors such as [insert external factors here] are also noted, which can influence the main topic in various ways.'},

        {'role': USER, 'content': 'What questions would help me look deeper into the topic?'},

        {'role': ASSISTANT, 'content': 'To delve deeper into the topic, you could consider the following questions:\n\nWhat are the underlying causes or reasons behind the key factors?\nHow do these factors interrelate and affect each other?\nWhat are the potential long-term implications of these factors?\nAre there any case studies or real-world examples that illustrate these factors in action?\nHow do external factors modify or influence the main factors?\nWhat are the possible solutions or strategies to address the challenges presented by these factorss?'}
        ]
    
    # # Define a class variable for the base URL
    # EMBEDDING_SERVICE_BASE_URL = 'https://infoasst-cr-{}.azurewebsites.net'
    
    def __init__(
        self,
        azure_openai_token_provider: str,
        chatgpt_deployment: str,
        query_term_language: str,
        model_name: str,
        model_version: str,
        azure_openai_endpoint: str
    ):
        self.chatgpt_deployment = chatgpt_deployment
        self.query_term_language = query_term_language
        self.chatgpt_token_limit = get_token_limit(model_name)
        
        openai.api_base = azure_openai_endpoint
        openai.api_type = "azure_ad"
        openai.azure_ad_token_provider = azure_openai_token_provider
        openai.api_version = "2024-02-01"

        self.model_name = model_name
        self.model_version = model_version
        
        self.client = AsyncAzureOpenAI(
        azure_endpoint = openai.api_base, 
        azure_ad_token_provider=azure_openai_token_provider,
        api_version=openai.api_version)

    # def run(self, history: list[dict], overrides: dict) -> any:
    async def run(self, history: Sequence[dict[str, str]], overrides: dict[str, Any], citation_lookup: dict[str, Any], thought_chain: dict[str, Any]) -> Any:
        user_persona = overrides.get("user_persona", "")
        system_persona = overrides.get("system_persona", "")
        response_length = int(overrides.get("response_length") or 1024)

        user_q = 'Generate response for: ' + history[-1]["user"]
        thought_chain["user_query"] = history[-1]["user"]
        #Generate the follow up prompt to be sent to the GPT model
        follow_up_questions_prompt = (
            self.follow_up_questions_prompt_content
            if overrides.get("suggest_followup_questions")
            else ""
        )

        system_message = self.system_message_chat_conversation.format(
            injected_prompt="",
            follow_up_questions_prompt=follow_up_questions_prompt,
            response_length_prompt=self.get_response_length_prompt_text(
                response_length
            ),
            userPersona=user_persona,
            systemPersona=system_persona,
        )
    
        #Generate a contextual and content-specific answer using the search results and chat history.
        #Added conditional block to use different system messages for different models.
        messages = self.get_messages_from_history(
            system_message,
            self.model_name,
            history,
            history[-1]["user"] + "\n\n",
            self.response_prompt_few_shots,
            max_tokens=self.chatgpt_token_limit - 500
        )

        try:
            chat_completion= await self.client.chat.completions.create(
                model=self.chatgpt_deployment,
                messages=messages,
                temperature=0.6,
                n=1,
                stream=True
            ) 
            msg_to_display = '\n\n'.join([str(message) for message in messages])
                    # Return the data we know
            yield json.dumps({"data_points": {},
                            "thoughts": f"Searched for:<br>{user_q}<br><br>Conversations:<br>" + msg_to_display.replace('\n', '<br>'),
                            "thought_chain": thought_chain,
                            "work_citation_lookup": {},
                            "web_citation_lookup": {}}) + "\n"
            
            # STEP 4: Format the response
            async for chunk in chat_completion:
                # Check if there is at least one element and the first element has the key 'delta'
                if len(chunk.choices) > 0:
                    filter_reasons = []
                    # Check for content filtering
                    if chunk.choices[0].finish_reason == 'content_filter':
                        for category, details in chunk.choices[0].content_filter_results.items():
                            if details['filtered']:
                                filter_reasons.append(f"{category} ({details['severity']})")

                    # Raise an error if any filters are triggered
                    if filter_reasons:
                        error_message = "The generated content was filtered due to triggering Azure OpenAI's content filtering system. Reason(s): The response contains content flagged as " + ", ".join(filter_reasons)
                        raise ValueError(error_message)
                    yield json.dumps({"content": chunk.choices[0].delta.content}) + "\n"
        except BadRequestError as e:
            logging.error(f"Error generating chat completion: {str(e.body['message'])}")
            yield json.dumps({"error": f"Error generating chat completion: {str(e.body['message'])}"}) + "\n"
            return
        except Exception as e:
            logging.error(f"Error in GPTDirectApproach: {e}")
            yield json.dumps({"error": f"An error occurred while generating the completion. {e}"}) + "\n"
            return

    
