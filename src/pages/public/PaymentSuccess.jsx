import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState('loading');
  const [paymentData, setPaymentData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const sessionId = searchParams.get('session_id');
  const paymentLinkId = searchParams.get('payment_link_id');

  useEffect(() => {
    // Verify payment success
    if (paymentLinkId) {
      verifyPaymentSuccess();
    } else {
      setPaymentStatus('error');
      setErrorMessage('Invalid payment link');
    }
  }, [paymentLinkId]);

  const verifyPaymentSuccess = async () => {
    try {
      // NEW: Direct verification with faster polling and immediate first check
      let attempts = 0;
      const maxAttempts = 15; // Increased to 15 attempts
      const pollInterval = 1500; // Faster - 1.5 seconds

      const checkPayment = async () => {
        try {
          // VITE_API_URL already includes /api, so we don't add it again
          const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
          
          // Pass session_id to enable direct Stripe verification
          const url = `${API_BASE}/payments/public/link/${paymentLinkId}/verify-success/${sessionId ? `?session_id=${sessionId}` : ''}`;
          
          const response = await axios.get(url);

          if (response.data.payment_completed) {
            setPaymentStatus('success');
            setPaymentData(response.data.data);
          } else if (attempts < maxAttempts) {
            // Payment still processing, try again
            attempts++;
            setTimeout(checkPayment, pollInterval);
          } else {
            // Max attempts reached, show pending status
            setPaymentStatus('pending');
            setPaymentData(response.data);
          }
        } catch (error) {
          console.error('Error verifying payment:', error);
          if (attempts < maxAttempts) {
            attempts++;
            setTimeout(checkPayment, pollInterval);
          } else {
            setPaymentStatus('error');
            setErrorMessage('Unable to verify payment status. Please contact support.');
          }
        }
      };

      // Start checking immediately (no delay)
      checkPayment();
    } catch (error) {
      console.error('Error:', error);
      setPaymentStatus('error');
      setErrorMessage('An error occurred while verifying your payment.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {paymentStatus === 'loading' && (
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Processing Payment...</h2>
            <p className="text-gray-600">Please wait while we verify your payment.</p>
          </div>
        )}

        {paymentStatus === 'success' && paymentData && (
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="mb-6">
              <FiCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
              <p className="text-gray-600">Thank you for your payment.</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="space-y-3 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Amount Paid:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${parseFloat(paymentData.amount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Name:</span>
                  <span className="text-gray-800 font-medium">{paymentData.debtor_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Account ID:</span>
                  <span className="text-gray-800 font-medium">{paymentData.debtor_id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Reference:</span>
                  <span className="text-gray-800 font-mono text-xs">
                    {paymentData.reference_number?.substring(0, 20)}...
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Date:</span>
                  <span className="text-gray-800">
                    {new Date(paymentData.completed_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>✓ Your payment has been processed successfully.</strong>
                <br />
                Your account has been updated and all dashboards have been synchronized.
              </p>
            </div>

            <div className="text-sm text-gray-500">
              <p>A confirmation has been sent to your email.</p>
              <p className="mt-2">You can close this window now.</p>
            </div>
          </div>
        )}

        {paymentStatus === 'pending' && (
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <FiClock className="text-yellow-500 text-6xl mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Processing</h2>
            <p className="text-gray-600 mb-4">
              Your payment is being confirmed. This usually takes a few seconds.
            </p>
            <div className="mb-6">
              <div className="animate-pulse flex justify-center space-x-2">
                <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                <div className="h-3 w-3 bg-yellow-500 rounded-full animation-delay-200"></div>
                <div className="h-3 w-3 bg-yellow-500 rounded-full animation-delay-400"></div>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800 font-medium mb-2">
                ✓ Your payment was received by Stripe
              </p>
              <p className="text-sm text-yellow-800">
                We're updating your account now. Please wait a moment...
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setPaymentStatus('loading');
                  verifyPaymentSuccess();
                }}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium shadow-md"
              >
                Check Status Again
              </button>
              <p className="text-xs text-gray-500">
                If the payment doesn't complete after 30 seconds, please contact support with session ID: {sessionId?.substring(0, 20)}...
              </p>
            </div>
          </div>
        )}

        {paymentStatus === 'error' && (
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <FiXCircle className="text-red-500 text-6xl mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Unable to Verify Payment</h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                If you believe you completed the payment successfully, please contact our support team
                with your transaction details.
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Session ID: {sessionId}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
