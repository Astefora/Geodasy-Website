import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { FiMail, FiCheckCircle, FiAlertCircle, FiLoader } from "react-icons/fi";

const BRAND = "#3949ab";

/**
 * VerifyEmail page — handles three scenarios:
 *
 * 1. /verify-email?token=...&id=...
 *    The user clicked the link from their email. We hit the backend
 *    GET /api/verify-email which redirects back here with ?status=success
 *    or ?status=already.
 *
 *    NOTE: The backend does the actual verification and redirects here.
 *    This page only needs to show the result state.
 *
 * 2. /verify-email?status=success  — show success UI
 * 3. /verify-email?status=already  — already verified UI
 * 4. /verify-email (no params)     — "check your inbox" landing
 */
function VerifyEmail() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const status = params.get("status"); // "success" | "already" | null
  const token = params.get("token"); // present when coming from email link
  const id = params.get("id"); // present when coming from email link

  // ── If token+id are in the URL, the backend redirect hasn't happened yet.
  // That means the user landed here directly (e.g. from the email link going
  // to the frontend route). We proxy the verification ourselves.
  const [verifyState, setVerifyState] = useState(
    status ? status : token && id ? "verifying" : "pending",
  );
  const [errorMsg, setErrorMsg] = useState("");

  // Resend state
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState("idle"); // idle | sending | sent | error

  useEffect(() => {
    // Only run if we have a token+id but no status yet (direct email link)
    if (token && id && !status) {
      fetch(`/api/verify-email?token=${token}&id=${id}`, {
        redirect: "manual", // don't follow the redirect — handle it ourselves
      })
        .then((res) => {
          // fetch() with redirect:"manual" returns an opaque response (type === "opaqueredirect")
          // which means the server returned a 3xx. We treat that as success.
          if (res.type === "opaqueredirect" || res.ok) {
            setVerifyState("success");
          } else {
            return res.json().then((data) => {
              setVerifyState("error");
              setErrorMsg(data.error || "Verification failed.");
            });
          }
        })
        .catch(() => {
          setVerifyState("error");
          setErrorMsg(
            "Could not reach the server. Make sure the backend is running.",
          );
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResend = async (e) => {
    e.preventDefault();
    setResendStatus("sending");
    try {
      const res = await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });
      await res.json();
      setResendStatus("sent");
    } catch {
      setResendStatus("error");
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px 24px",
        background: "transparent",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          maxWidth: "820px",
          borderRadius: "28px",
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
          minHeight: "400px",
        }}
      >
        {/* ── Left: Status panel ── */}
        <div
          style={{
            flex: "1 1 60%",
            background: "#f0eeff",
            padding: "44px 40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            gap: "20px",
          }}
        >
          {/* ── VERIFYING ── */}
          {verifyState === "verifying" && (
            <>
              <FiLoader
                size={52}
                color={BRAND}
                style={{ animation: "spin 1s linear infinite" }}
              />
              <h2
                style={{
                  color: BRAND,
                  fontWeight: 700,
                  fontSize: "22px",
                  margin: 0,
                }}
              >
                Verifying your email…
              </h2>
              <p style={{ color: "#666", fontSize: "13px", margin: 0 }}>
                Please wait a moment.
              </p>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </>
          )}

          {/* ── SUCCESS ── */}
          {(verifyState === "success" || verifyState === "already") && (
            <>
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  background: "#e8f5e9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FiCheckCircle size={36} color="#4caf50" />
              </div>
              <h2
                style={{
                  color: BRAND,
                  fontWeight: 700,
                  fontSize: "22px",
                  margin: 0,
                }}
              >
                {verifyState === "already"
                  ? "Already Verified!"
                  : "Email Verified!"}
              </h2>
              <p
                style={{
                  color: "#555",
                  fontSize: "13px",
                  margin: 0,
                  maxWidth: "320px",
                  lineHeight: 1.6,
                }}
              >
                {verifyState === "already"
                  ? "Your email address has already been verified. You can log in once your account is approved by an admin."
                  : "Your email address has been confirmed. Your account is now pending admin approval — you'll receive an email once approved."}
              </p>
              <Link to="/login">
                <button
                  style={{
                    padding: "11px 32px",
                    background: BRAND,
                    color: "#fff",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Go to Login
                </button>
              </Link>
            </>
          )}

          {/* ── ERROR ── */}
          {verifyState === "error" && (
            <>
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  background: "#ffebee",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FiAlertCircle size={36} color="#ef5350" />
              </div>
              <h2
                style={{
                  color: "#c62828",
                  fontWeight: 700,
                  fontSize: "20px",
                  margin: 0,
                }}
              >
                Verification Failed
              </h2>
              <p
                style={{
                  color: "#555",
                  fontSize: "13px",
                  margin: 0,
                  maxWidth: "320px",
                  lineHeight: 1.6,
                }}
              >
                {errorMsg || "This link is invalid or has expired."}
              </p>

              {/* Resend form */}
              <div style={{ width: "100%", maxWidth: "320px" }}>
                <p
                  style={{
                    color: "#777",
                    fontSize: "12px",
                    margin: "0 0 10px",
                  }}
                >
                  Request a new verification email:
                </p>
                {resendStatus === "sent" ? (
                  <p
                    style={{
                      color: "#2e7d32",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    ✓ New verification email sent — check your inbox.
                  </p>
                ) : (
                  <form
                    onSubmit={handleResend}
                    style={{ display: "flex", gap: "8px" }}
                  >
                    <input
                      type="email"
                      required
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="Your email address"
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        border: "1.5px solid #d8d4f0",
                        borderRadius: "10px",
                        fontSize: "13px",
                        background: "rgba(255,255,255,0.80)",
                        outline: "none",
                        color: "#333",
                      }}
                    />
                    <button
                      type="submit"
                      disabled={resendStatus === "sending"}
                      style={{
                        padding: "10px 16px",
                        background: BRAND,
                        color: "#fff",
                        border: "none",
                        borderRadius: "10px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        opacity: resendStatus === "sending" ? 0.7 : 1,
                      }}
                    >
                      {resendStatus === "sending" ? "…" : "Resend"}
                    </button>
                  </form>
                )}
              </div>
            </>
          )}

          {/* ── PENDING (no params — post-registration landing) ── */}
          {verifyState === "pending" && (
            <>
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  background: "#e8eaf6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FiMail size={36} color={BRAND} />
              </div>
              <h2
                style={{
                  color: BRAND,
                  fontWeight: 700,
                  fontSize: "22px",
                  margin: 0,
                }}
              >
                Check your inbox
              </h2>
              <p
                style={{
                  color: "#555",
                  fontSize: "13px",
                  margin: 0,
                  maxWidth: "340px",
                  lineHeight: 1.6,
                }}
              >
                We sent a verification link to your email. Click it to confirm
                your address — the link expires in <strong>24 hours</strong>.
              </p>
              <p style={{ color: "#888", fontSize: "12px", margin: 0 }}>
                Don't see it? Check your spam folder.
              </p>

              {/* Resend form */}
              <div style={{ width: "100%", maxWidth: "320px" }}>
                <p
                  style={{
                    color: "#777",
                    fontSize: "12px",
                    margin: "0 0 10px",
                  }}
                >
                  Didn't receive it? Resend:
                </p>
                {resendStatus === "sent" ? (
                  <p
                    style={{
                      color: "#2e7d32",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    ✓ New verification email sent!
                  </p>
                ) : (
                  <form
                    onSubmit={handleResend}
                    style={{ display: "flex", gap: "8px" }}
                  >
                    <input
                      type="email"
                      required
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="Your email address"
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        border: "1.5px solid #d8d4f0",
                        borderRadius: "10px",
                        fontSize: "13px",
                        background: "rgba(255,255,255,0.80)",
                        outline: "none",
                        color: "#333",
                      }}
                    />
                    <button
                      type="submit"
                      disabled={resendStatus === "sending"}
                      style={{
                        padding: "10px 16px",
                        background: BRAND,
                        color: "#fff",
                        border: "none",
                        borderRadius: "10px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        opacity: resendStatus === "sending" ? 0.7 : 1,
                      }}
                    >
                      {resendStatus === "sending" ? "…" : "Resend"}
                    </button>
                  </form>
                )}
              </div>

              <Link to="/login" style={{ color: BRAND, fontSize: "12px" }}>
                Back to Login
              </Link>
            </>
          )}
        </div>

        {/* ── Right: Info panel ── */}
        <div
          style={{
            flex: "1 1 40%",
            background: BRAND,
            padding: "44px 36px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px" }}>
            {verifyState === "success" || verifyState === "already"
              ? "🎉"
              : "📬"}
          </div>
          <h1
            style={{
              color: "#f0d060",
              fontWeight: 800,
              fontSize: "30px",
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            Email
            <br />
            Verification
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.82)",
              fontSize: "13px",
              margin: 0,
              maxWidth: "200px",
              lineHeight: 1.6,
            }}
          >
            {verifyState === "success" || verifyState === "already"
              ? "You're all set! Admin review is the final step."
              : "One more step before your account is activated."}
          </p>
          <p
            style={{
              color: "rgba(255,255,255,0.60)",
              fontSize: "11px",
              margin: 0,
            }}
          >
            Need help? Contact your department admin.
          </p>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
