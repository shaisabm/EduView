from django.contrib.auth.tokens import PasswordResetTokenGenerator

class GenerateToken(PasswordResetTokenGenerator):
    def _make_hash_value(self, user, timestamp):
        return str(user.pk) + str(timestamp)




token_generator = GenerateToken()
