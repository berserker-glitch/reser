import React from 'react';
import { Box, Typography, Button, Card, CardContent, Alert } from '@mui/material';

const TokenDebugger: React.FC = () => {
  const [tokenInfo, setTokenInfo] = React.useState<any>(null);

  const analyzeTokens = () => {
    const adminToken = localStorage.getItem('admin_token');
    const accessToken = localStorage.getItem('access_token');
    const clientToken = localStorage.getItem('client_token');
    const adminUser = localStorage.getItem('admin_user');
    const adminSalon = localStorage.getItem('admin_salon');

    const info = {
      adminToken: adminToken ? `${adminToken.substring(0, 50)}...` : 'None',
      accessToken: accessToken ? `${accessToken.substring(0, 50)}...` : 'None',
      clientToken: clientToken ? `${clientToken.substring(0, 50)}...` : 'None',
      adminUser: adminUser ? JSON.parse(adminUser) : null,
      adminSalon: adminSalon ? JSON.parse(adminSalon) : null,
      tokenCount: [adminToken, accessToken, clientToken].filter(Boolean).length
    };

    setTokenInfo(info);
  };

  const clearAllTokens = () => {
    localStorage.clear();
    setTokenInfo(null);
    alert('All tokens cleared!');
  };

  const setFreshToken = () => {
    localStorage.clear();
    localStorage.setItem('admin_token', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0IiwiaWF0IjoxNzUzMjI2NzU2LCJleHAiOjE3NTMyMzAzNTYsIm5iZiI6MTc1MzIyNjc1NiwianRpIjoiM3BYQ2JNU0E3NTI2T0p4WSIsInN1YiI6IjEiLCJwcnYiOiIyM2JkNWM4OTQ5ZjYwMGFkYjM5ZTcwMWM0MDA4NzJkYjdhNTk3NmY3In0.ToijXq8w5psoYY4cLTT8On_OCAn-L6O1I1kaWStDEk0');
    localStorage.setItem('admin_user', '{"id":1,"full_name":"Salon Owner","email":"owner@salon.com","role":"OWNER"}');
    localStorage.setItem('admin_salon', '{"id":1,"name":"Salon Elite Rabat","description":"Premium salon in Rabat","owner_id":1}');
    alert('Fresh admin token and salon data set! Refresh the page.');
  };

  React.useEffect(() => {
    analyzeTokens();
  }, []);

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>Admin Token Debugger</Typography>
      
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button variant="contained" onClick={analyzeTokens}>Analyze Tokens</Button>
        <Button variant="outlined" color="warning" onClick={clearAllTokens}>Clear All</Button>
        <Button variant="contained" color="success" onClick={setFreshToken}>Set Fresh Token</Button>
      </Box>

      {tokenInfo && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Token Analysis</Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">Token Count: {tokenInfo.tokenCount}</Typography>
              {tokenInfo.tokenCount > 1 && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  Multiple tokens detected! This might cause conflicts.
                </Alert>
              )}
            </Box>

            <Typography variant="subtitle2">Admin Token:</Typography>
            <Typography variant="body2" sx={{ mb: 1, fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {tokenInfo.adminToken}
            </Typography>

            <Typography variant="subtitle2">Access Token:</Typography>
            <Typography variant="body2" sx={{ mb: 1, fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {tokenInfo.accessToken}
            </Typography>

            <Typography variant="subtitle2">Client Token:</Typography>
            <Typography variant="body2" sx={{ mb: 2, fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {tokenInfo.clientToken}
            </Typography>

            <Typography variant="subtitle2">Admin User:</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {tokenInfo.adminUser ? JSON.stringify(tokenInfo.adminUser, null, 2) : 'None'}
            </Typography>

            <Typography variant="subtitle2">Admin Salon:</Typography>
            <Typography variant="body2">
              {tokenInfo.adminSalon ? JSON.stringify(tokenInfo.adminSalon, null, 2) : 'None'}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default TokenDebugger; 