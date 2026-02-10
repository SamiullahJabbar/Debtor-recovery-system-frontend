import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiXCircle } from 'react-icons/fi';

const PaymentCancel = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentLinkId = searchParams.get('payment_link_id');

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <FiXCircle className="text-red-500 text-6xl mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Cancelled</h1>
          <p className="text-gray-600 mb-6">
            You have cancelled the payment process.
          </p>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-orange-800">
              No charges have been made to your account. If you need assistance or want to try again,
              please contact our support team.
            </p>
          </div>

          <div className="text-sm text-gray-500">
            <p>You can close this window now or try making the payment again.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;
