import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get the access key from environment variable
  const accessKey = Netlify.env.get("WEB3FORMS_ACCESS_KEY");

  if (!accessKey) {
    console.error("WEB3FORMS_ACCESS_KEY environment variable is not set");
    return new Response(JSON.stringify({ success: false, message: "Server configuration error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Parse the incoming form data
    const formData = await req.formData();

    // Build the payload for Web3Forms
    const payload = new URLSearchParams();
    payload.append("access_key", accessKey);

    // Transfer all form fields except access_key (we use our secure one)
    for (const [key, value] of formData.entries()) {
      if (key !== "access_key") {
        payload.append(key, typeof value === "string" ? value : String(value));
      }
    }

    // Submit to Web3Forms
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload.toString(),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.ok ? 200 : 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Contact form submission error:", error);
    return new Response(JSON.stringify({ success: false, message: "Failed to submit form" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config: Config = {
  path: "/api/contact",
};
