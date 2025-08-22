import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Note as NoteIcon
} from '@mui/icons-material';
import { useNotaFetch } from '../hooks/useNotaFetch';

interface NotaModalProps {
  open: boolean;
  onClose: () => void;
  numeroCaso: string;
}

const NotaModal: React.FC<NotaModalProps> = ({
  open,
  onClose,
  numeroCaso
}) => {
  const { nota, loading, error, fetchNota, clearNota } = useNotaFetch();

  useEffect(() => {
    if (open && numeroCaso) {
      fetchNota(numeroCaso);
    } else {
      clearNota();
    }
  }, [open, numeroCaso, fetchNota, clearNota]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden'
        }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ 
        backgroundColor: 'info.main', 
        color: 'white',
        position: 'relative',
        py: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <NoteIcon sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold', pr: 6 }}>
            Nota del Caso: {numeroCaso}
          </Typography>
        </Box>
        <IconButton 
          onClick={onClose} 
          sx={{ 
            position: 'absolute',
            right: 16,
            top: 16,
            color: 'white'
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, minHeight: '200px' }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '150px' }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Cargando nota...</Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ 
            textAlign: 'center', 
            py: 4,
            backgroundColor: 'error.50',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'error.200'
          }}>
            <Typography color="error.main" sx={{ fontWeight: 'bold', mb: 1 }}>
              Error al cargar la nota
            </Typography>
            <Typography variant="body2" color="error.dark">
              {error}
            </Typography>
          </Box>
        )}

        {!loading && !error && (
          <Box>
            {nota ? (
              <Box sx={{ 
                backgroundColor: 'grey.50',
                p: 3,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'grey.200'
              }}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    color: 'text.primary'
                  }}
                >
                  {nota}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ 
                textAlign: 'center', 
                py: 4,
                backgroundColor: 'grey.50',
                borderRadius: 2
              }}>
                <NoteIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  Sin nota disponible
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No se encontró información de nota para este caso.
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={onClose}
          variant="contained"
          size="large"
          sx={{ 
            minWidth: 120,
            textTransform: 'uppercase',
            fontWeight: 'bold'
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotaModal;
