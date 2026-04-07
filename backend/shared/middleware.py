import threading


_user_state = threading.local()


def get_current_user():
    return getattr(_user_state, "user", None)


class CurrentUserMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _user_state.user = getattr(request, "user", None)
        response = self.get_response(request)
        _user_state.user = None
        return response
