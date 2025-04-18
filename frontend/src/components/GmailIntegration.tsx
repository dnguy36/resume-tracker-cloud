import React, { useState } from 'react';
import { Button, Alert, Badge } from 'react-bootstrap';

interface GmailIntegrationProps {
    isAuthenticated: boolean;
    onSync: () => Promise<void>;
    syncing: boolean;
}

export default function GmailIntegration({ isAuthenticated, onSync, syncing }: GmailIntegrationProps) {
    const [error, setError] = useState<string | null>(null);
    const [openaiStatus, setOpenaiStatus] = useState<string | null>(null);
    const [testingOpenai, setTestingOpenai] = useState(false);

    const handleAuthClick = async () => {
        try {
            const response = await fetch('/api/auth/gmail', {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.auth_url) {
                window.location.href = data.auth_url;
            } else {
                setError('Failed to get authentication URL');
            }
        } catch (error) {
            setError('Failed to initiate Gmail authentication');
            console.error('Error:', error);
        }
    };

    const handleDisconnectClick = async () => {
        try {
            const response = await fetch('/api/gmail/disconnect', {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                window.location.reload();
            } else {
                setError('Failed to disconnect Gmail');
            }
        } catch (error) {
            setError('Failed to disconnect Gmail');
            console.error('Error:', error);
        }
    };

    const testOpenAI = async () => {
        setTestingOpenai(true);
        setOpenaiStatus(null);
        try {
            const response = await fetch('/api/test-openai', {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (response.ok) {
                setOpenaiStatus(`OpenAI is working! Response: "${data.response}"`);
            } else {
                setError(data.error || 'Failed to connect to OpenAI');
            }
        } catch (error) {
            setError('Failed to test OpenAI connection');
            console.error('Error:', error);
        } finally {
            setTestingOpenai(false);
        }
    };

    return (
        <div className="gmail-integration p-3 bg-white rounded shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                    <h5 className="mb-0 me-2">Gmail Integration</h5>
                    {isAuthenticated && (
                        <Badge bg="success">Connected</Badge>
                    )}
                </div>
                {isAuthenticated && (
                    <Button 
                        variant="outline-danger"
                        size="sm"
                        onClick={handleDisconnectClick}
                        disabled={syncing}
                    >
                        <i className="fas fa-unlink me-1"></i>
                        Disconnect
                    </Button>
                )}
            </div>
            
            {error && (
                <Alert variant="danger" onClose={() => setError(null)} dismissible>
                    {error}
                </Alert>
            )}
            
            {openaiStatus && (
                <Alert variant="info" onClose={() => setOpenaiStatus(null)} dismissible>
                    {openaiStatus}
                </Alert>
            )}

            {!isAuthenticated ? (
                <div>
                    <p>Connect your Gmail account to automatically track job applications.</p>
                    <div className="d-flex flex-column gap-2">
                        <Button variant="primary" onClick={handleAuthClick}>
                            <i className="fas fa-link me-1"></i>
                            Connect Gmail
                        </Button>
                        <Button 
                            variant="secondary" 
                            onClick={testOpenAI}
                            disabled={testingOpenai}
                        >
                            {testingOpenai ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Testing OpenAI...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-robot me-1"></i>
                                    Test OpenAI Connection
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            ) : (
                <div>
                    <p className="mb-3">Import your job applications directly from Gmail.</p>
                    <div className="d-flex flex-column gap-2">
                        <Button 
                            variant="primary" 
                            onClick={onSync}
                            disabled={syncing}
                        >
                            {syncing ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Syncing...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-sync me-1"></i>
                                    Sync Applications
                                </>
                            )}
                        </Button>
                        <Button 
                            variant="secondary" 
                            onClick={testOpenAI}
                            disabled={testingOpenai}
                        >
                            {testingOpenai ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Testing OpenAI...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-robot me-1"></i>
                                    Test OpenAI Connection
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
} 