import CryptoJS from 'crypto-js';

// AWS Signature Version 4 signing process
export function createSignature(method, uri, queryString, headers, payload, accessKey, secretKey, region, service) {
    const algorithm = 'AWS4-HMAC-SHA256';
    const date = new Date().toISOString().replace(/[:\-]|\..\d{3}/g, '');
    const dateStamp = date.substr(0, 8);
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    
    // Create canonical request
    const canonicalHeaders = Object.keys(headers)
        .sort()
        .map(key => `${key.toLowerCase()}:${headers[key]}\n`)
        .join('');
    
    const signedHeaders = Object.keys(headers)
        .sort()
        .map(key => key.toLowerCase())
        .join(';');
    
    const payloadHash = CryptoJS.SHA256(payload).toString();
    
    const canonicalRequest = [
        method,
        uri,
        queryString,
        canonicalHeaders,
        signedHeaders,
        payloadHash
    ].join('\n');
    
    // Create string to sign
    const stringToSign = [
        algorithm,
        date,
        credentialScope,
        CryptoJS.SHA256(canonicalRequest).toString()
    ].join('\n');
    
    // Calculate signature
    const kDate = CryptoJS.HmacSHA256(dateStamp, `AWS4${secretKey}`);
    const kRegion = CryptoJS.HmacSHA256(region, kDate);
    const kService = CryptoJS.HmacSHA256(service, kRegion);
    const kSigning = CryptoJS.HmacSHA256('aws4_request', kService);
    const signature = CryptoJS.HmacSHA256(stringToSign, kSigning).toString();
    
    return {
        signature,
        date,
        credentialScope,
        signedHeaders
    };
}