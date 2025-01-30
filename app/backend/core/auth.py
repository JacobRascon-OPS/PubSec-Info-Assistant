from fastapi import Request, HTTPException, status

user_header = "X-User-Principal-Name"

def get_user(request : Request) -> str:
    if user_header not in request.headers:
        raise HTTPException(
            status_code=400, #status.HTTP_401_UNAUTHORIZED
            detail=user_header +  " header missing",
        )
    login_user = request.headers[user_header]
    return login_user
