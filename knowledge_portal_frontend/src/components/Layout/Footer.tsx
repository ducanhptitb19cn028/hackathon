import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer = () => {
  return (
    <Box component="footer" sx={{ mt: 'auto', py: 3, bgcolor: 'grey.200' }}>
      <Typography variant="body2" align="center">
        © {new Date().getFullYear()} Knowledge Portal
      </Typography>
    </Box>
  );
};

export default Footer;
