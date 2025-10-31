import * as jose from 'jose';

export default function handler(req, res) {
  res.status(200).json({
    message: 'Jose imported successfully!',
    jose_version: jose.version || 'unknown'
  });
}
