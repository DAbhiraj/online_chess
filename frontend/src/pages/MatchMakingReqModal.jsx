// components/MatchmakingRequestModal.jsx

import React from "react";
import { Modal, Box, Typography, Button } from "@mui/material";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  borderRadius: "12px",
  boxShadow: 24,
  p: 4,
};

const MatchmakingRequestModal = ({ open, request, onConfirm, onReject }) => {
  return (
    <Modal
      open={open}
      onClose={onReject}
      aria-labelledby="matchmaking-request-title"
      aria-describedby="matchmaking-request-description"
    >
      <Box sx={style}>
        <Typography id="matchmaking-request-title" variant="h6" component="h2" gutterBottom>
          Matchmaking Request
        </Typography>
        <Typography id="matchmaking-request-description" sx={{ mb: 2 }}>
          {`${request?.userId} invited you to a game. Do you accept?`}
        </Typography>
        <Box display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="contained" color="success" onClick={onConfirm}>
            ✅ Accept
          </Button>
          <Button variant="outlined" color="error" onClick={onReject}>
            ❌ Reject
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default MatchmakingRequestModal;
