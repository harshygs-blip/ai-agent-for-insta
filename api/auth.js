// Vercel Serverless Function: Meta OAuth Redirect Handler
module.exports = async (req, res) => {
  const code = req.query.code;
  if (code) {
    // Redirect to friendly confirmation page with code
    return res.redirect(302, `/auth.html?code=${encodeURIComponent(code)}`);
  }
  return res.redirect(302, '/auth.html');
};
