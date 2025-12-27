
import React, { useState } from 'react';
import {
    Box, Typography, List, ListItem, ListItemAvatar, ListItemText,
    Avatar, IconButton, Button, Fade
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useTheme } from '@mui/material/styles';

const SAVED_ADMINS_KEY = 'craftsoft_saved_admins';

export default function AccountPicker({ onSelect, onAddAccount }) {
    const theme = useTheme();
    const [savedAdmins, setSavedAdmins] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(SAVED_ADMINS_KEY) || '[]');
        } catch { return []; }
    });
    const [isEditing, setIsEditing] = useState(false);

    // Keyboard Nav Logic (Simplified for React)
    // We can add it back later if needed, but standard Tab nav works well in React/MUI usually.

    const handleDelete = (id) => {
        if (window.confirm('Remove this account?')) {
            const updated = savedAdmins.filter(a => a.id !== id);
            setSavedAdmins(updated);
            localStorage.setItem(SAVED_ADMINS_KEY, JSON.stringify(updated));
            if (updated.length === 0) onAddAccount();
        }
    };

    const getAvatarColor = (name) => {
        // Generate deterministic color or use stored
        return 'linear-gradient(135deg, #2896cd 0%, #6C5CE7 100%)';
    };

    // If no saved, render nothing (parent should handle)
    if (savedAdmins.length === 0) {
        // Small side effect warning: better to handle inside render logic or effect
        return null;
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <Button
                    onClick={() => setIsEditing(!isEditing)}
                    size="small"
                    sx={{ fontWeight: 600, color: 'primary.main', textTransform: 'uppercase' }}
                >
                    {isEditing ? 'Done' : 'Manage'}
                </Button>
            </Box>

            <List sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {savedAdmins.map((admin) => (
                    <ListItem
                        key={admin.id}
                        sx={{
                            bgcolor: isEditing ? 'background.paper' : 'grey.50',
                            border: '1px solid',
                            borderColor: 'grey.200',
                            borderRadius: 3,
                            cursor: isEditing ? 'default' : 'pointer',
                            pr: isEditing ? 8 : 2, // Space for delete btn
                            transition: 'all 0.2s',
                            '&:hover': {
                                bgcolor: isEditing ? 'background.paper' : 'background.paper',
                                borderColor: isEditing ? 'grey.200' : 'primary.300',
                                boxShadow: isEditing ? 'none' : theme.shadows[2],
                                transform: isEditing ? 'none' : 'translateY(-2px)'
                            }
                        }}
                        onClick={() => !isEditing && onSelect(admin)}
                    >
                        <ListItemAvatar>
                            <Avatar
                                sx={{
                                    background: admin.color || getAvatarColor(admin.full_name),
                                    borderRadius: 2,
                                    fontWeight: 700
                                }}
                            >
                                {admin.full_name?.charAt(0) || 'A'}
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    {admin.full_name}
                                </Typography>
                            }
                            secondary={
                                <Box component="span" sx={{
                                    bgcolor: 'grey.200', color: 'grey.600',
                                    px: 1, py: 0.25, borderRadius: 1, fontSize: '0.75rem', fontWeight: 600
                                }}>
                                    {admin.admin_id}
                                </Box>
                            }
                        />
                        {isEditing ? (
                            <Fade in={isEditing}>
                                <IconButton
                                    onClick={(e) => { e.stopPropagation(); handleDelete(admin.id); }}
                                    sx={{
                                        position: 'absolute', right: 16,
                                        color: 'error.main',
                                        bgcolor: 'error.light',
                                        '&:hover': { bgcolor: 'error.light' }
                                    }}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Fade>
                        ) : (
                            <ChevronRightIcon sx={{ color: 'grey.400' }} />
                        )}
                    </ListItem>
                ))}
            </List>

            <Button
                fullWidth
                startIcon={<PersonAddIcon />}
                onClick={onAddAccount}
                sx={{
                    mt: 3,
                    border: '2px dashed',
                    borderColor: 'grey.300',
                    color: 'grey.600',
                    py: 1.5,
                    borderRadius: 3,
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50', color: 'primary.main' }
                }}
            >
                Use another account
            </Button>
        </Box>
    );
}
