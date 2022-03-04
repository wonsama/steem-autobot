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
 * 입력받은 시간 문자열을 한국 시간[zone=9] 형태로 변환 처리한다
 * [입력] 2022-03-03T09:40:18
 * [출력] 2022-03-03 18:40:18
 * @param {string} time_str 시간 문자열
 * @param {number} zone 가감 할 시간
 * @returns string
 */
function time(time_str, zone = 9) {
  let d = new Date(time_str);
  d.setHours(d.getHours() + zone);
  return moment(new Date(d)).format("YYYY-MM-DD HH:mm:ss");
}

/**
 * 현재 시간 정보를 반환한다
 * @param {string} fmt 출력형태, default YYYY-MM-DD HH:mm:ss
 * @returns string
 */
function now(fmt = "YYYY-MM-DD HH:mm:ss") {
  return moment(new Date()).format(fmt);
}

////////////////////////////////////////////////////////////
//
// exports (외부 노출 함수 지정)
//

module.exports = {
  time,
  sleep,
  now,
};
