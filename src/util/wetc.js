////////////////////////////////////////////////////////////
//
// information (소개)
//

/*
  파일명 : title

  설명 : description

  최초작성일 : 2022.03.00
*/

////////////////////////////////////////////////////////////
//
// require (라이브러리 로딩)
//
const moment = require("moment");

////////////////////////////////////////////////////////////
//
// const (상수정의)
//
const RETRY_SEC = process.env.RETRY_SEC || 3 * 1000;
const TIMEZONE_OFFSET_KR = 60 * 9; // 한국은 +9 시간대임.

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
 * [sec] 초 동안 SLEEP 처리
 * @param {number} sec 초(밀리세컨), 1000 = 1초
 * @returns Promise
 */
async function sleep(sec = RETRY_SEC) {
  return new Promise((resolve) => setTimeout(resolve, sec));
}

/**
 * 입력 받은 시간 정보를(.000Z 누락 값) 포맷에 맞게 출력한다. 기본 타임존 한국
 * 2022-03-03T09:40:18 => 2022-03-03T09:40:18.000Z
 * @param {string} time_str 시간 문자열 ( .000Z 누락 값 )
 * @param {number} fmt 출력 포맷
 * @returns string
 */
function timestr(time_str, fmt = "YYYY-MM-DD HH:mm:ss") {
  return time(new Date(`${time_str}.000Z`), fmt);
}

/**
 * 입력 받은 시간 정보를 포맷에 맞게 출력한다. 기본 타임존 한국
 * @param {string} date 날짜
 * @param {number} fmt 출력 형식
 * @param {number} offset 타임존 값
 * @returns string
 */
function time(date, fmt = "YYYY-MM-DD HH:mm:ss", offset = TIMEZONE_OFFSET_KR) {
  return moment(date).utcOffset(offset).format(fmt);
}

/**
 * 현재 시간 정보를 반환한다
 * @param {string} fmt 출력형태, default YYYY-MM-DD HH:mm:ss
 * @returns string
 */
function now(fmt = "YYYY-MM-DD HH:mm:ss") {
  return moment(new Date()).utcOffset(TIMEZONE_OFFSET_KR).format(fmt);
}

////////////////////////////////////////////////////////////
//
// exports (외부 노출 함수 지정)
//

module.exports = {
  time,
  timestr,
  sleep,
  now,
};
