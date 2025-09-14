/**
 * Netlify Function for proxying requests to the Gemini API.
 * This function securely adds the API key on the server-side,
 * preventing it from being exposed on the client-side.
 */
exports.handler = async (event) => {
  // POSTリクエスト以外は許可しない
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Netlifyの環境変数からAPIキーを取得
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    console.error('Gemini API key is not configured.');
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'API key is not configured on the server.' }) 
    };
  }

  const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${geminiApiKey}`;

  try {
    // クライアントからのリクエストボディをそのままGemini APIに転送
    const response = await fetch(geminiApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: event.body,
    });

    const data = await response.json();

    // Gemini APIからのエラーレスポンスもそのままクライアントに返す
    if (!response.ok) {
        console.error('Gemini API Error:', data);
        return {
            statusCode: response.status,
            body: JSON.stringify(data),
        };
    }

    // 成功レスポンスをクライアントに返す
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Proxy function internal error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An internal error occurred while contacting the AI model.' }),
    };
  }
};
