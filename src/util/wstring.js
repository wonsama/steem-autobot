////////////////////////////////////////////////////////////
//
// information (소개)
//

/*
  파일명 : wstring.js

  설명 : string util

  최초작성일 : 2022.03.03
*/

////////////////////////////////////////////////////////////
//
// require (라이브러리 로딩)
//

////////////////////////////////////////////////////////////
//
// const (상수정의)
//

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
 * 입력받은 문자열의 우측을 패딩 처리한다
 * @param {string} source 입력 문자열
 * @param {number} len 길이
 * @param {char} char 패딩 처리할 단어, default " "
 * @returns string
 */
function rpad(source, len, char = " ") {
  return source.toString().padEnd(len, char);
}

/**
 * 입력받은 문자열의 좌측을 패딩 처리한다
 * @param {string} source 입력 문자열
 * @param {number} len 길이
 * @param {char} char 패딩 처리할 단어, default " "
 * @returns string
 */
function lpad(source, len, char = " ") {
  return source.toString().padStart(len, char);
}

////////////////////////////////////////////////////////////
//
// exports (외부 노출 함수 지정)
//

module.exports = {
  lpad,
  rpad,
};
