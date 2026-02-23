import os
import sentry_sdk


def send_test_event():
    dsn = os.getenv("SENTRY_DSN")
    if not dsn:
        print("SENTRY_DSN not set; skipping test event")
        return 2
    sentry_sdk.init(dsn=dsn, traces_sample_rate=0.0)
    try:
        sentry_sdk.capture_message("MIOS Sentry test event from CI")
        print("Test event sent to Sentry")
        return 0
    except Exception as e:
        print("Failed to send Sentry event:", e)
        return 3


if __name__ == "__main__":
    raise SystemExit(send_test_event())
