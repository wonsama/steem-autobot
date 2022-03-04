////////////////////////////////////////////////////////////
//
// information (소개)
//

/*
  파일명 : wcrypto.js

  설명 : 암복호화 처리용

  최초작성일 : 2022.03.03

  출처 : https://yceffort.kr/2020/06/encryption-decryption-nodejs
*/

////////////////////////////////////////////////////////////
//
// require (라이브러리 로딩)
//
const crypto = require("crypto");

////////////////////////////////////////////////////////////
//
// const (상수정의)
//
const IV_LENGTH = 16; // For AES, this is always 16
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "abcdefghijklmnop".repeat(2); // Must be 256 bits (32 characters)

////////////////////////////////////////////////////////////
//
// let (변수정의)
//

////////////////////////////////////////////////////////////
//
// private function (비공개 함수) 함수명을 _(언더스코어) 로 시작
//

////////////////////////////////////////////////////////////
//
// public function (공개 함수)
//

/**
 * 랜덤한 키를 생성한다
 * @param {number} len 길이
 * @returns string
 */
function generate(len = 20) {
  console.log("len", len);
  const LETTERS =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
  let res = [];
  for (let i = 0; i < len; i++) {
    res = res.concat(LETTERS[Math.floor(Math.random() * LETTERS.length)]);
  }
  return res.join("");
}

/**
 * 암호화
 * @param {string} text 평문
 * @returns string
 */
function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  const encrypted = cipher.update(text);

  return (
    iv.toString("hex") +
    ":" +
    Buffer.concat([encrypted, cipher.final()]).toString("hex")
  );
}

/**
 * 복호화
 * @param {string} text 암호화 된 문장
 * @returns string
 */
function decrypt(text) {
  const textParts = text.split(":");
  const iv = Buffer.from(textParts.shift(), "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  const decrypted = decipher.update(encryptedText);

  return Buffer.concat([decrypted, decipher.final()]).toString();
}

////////////////////////////////////////////////////////////
//
// exports (외부 노출 함수 지정)
//

module.exports = {
  encrypt,
  decrypt,
  generate,
};
