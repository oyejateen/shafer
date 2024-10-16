import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeProps {
  value: string;
}

const QRCode: React.FC<QRCodeProps> = ({ value }) => {
  return (
    <div className="inline-block p-2 bg-white rounded-lg">
      <QRCodeSVG value={value} size={128} />
    </div>
  );
};

export default QRCode;