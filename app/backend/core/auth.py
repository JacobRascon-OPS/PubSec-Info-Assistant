import os
from fastapi import Request, HTTPException

user_header = "X-MS-CLIENT-PRINCIPAL-NAME"

def get_user(request : Request) -> str:
    if os.getenv("APPLICATION_ENVIRONMENT") == "local":
       return "local user"
   
    if user_header not in request.headers:
        raise HTTPException(
            status_code=400, #status.HTTP_401_UNAUTHORIZED
            detail=user_header +  " header missing",
        )
    login_user = request.headers[user_header]
    return login_user.lower()
