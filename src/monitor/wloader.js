////////////////////////////////////////////////////////////
//
// information (소개)
//

/*
  파일명 : wloader.js

  설명 : 블록정보 로드 후 일치하는 커맨드 존재 시 해당 파일에 notify 해주도록 한다

  최초작성일 : 2022.03.03
*/

////////////////////////////////////////////////////////////
//
// require (라이브러리 로딩)
//
const fs = require("fs");
const { ROOT_PATH } = require("../util/wconst");
const { block, per } = fs.existsSync(`${ROOT_PATH}/saved/block.json`)
  ? require(`${ROOT_PATH}/saved/block.json`)
  : { block: 0, per: 200 }; // 최초 block.json 이 없는 경우 template 에서 기본 값을 읽어 주도록 한다
const wcore = require("./wcore");

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

const start = () => {
  const MONITORS = JSON.parse(process.env.MONITORS);
  // custom.config.js 에 정의 된 MONITORS 정보 로드 후
  // impl 폴더 내 파일이 존재하는지 확인 후 존재하는 대상만 로드
  const cmds = MONITORS.map((x) =>
    fs.existsSync(`${ROOT_PATH}/impl/${x.impl}.js`) ? x : null
  ).filter((x) => x);

  // impl 내 존재하는 함수는 반드시 notify 함수를 export 해야 된다

  // 모니터링 수행
  wcore.monitor({
    block,
    per,
    cmds,
  });
};

////////////////////////////////////////////////////////////
//
// exports (외부 노출 함수 지정)
//

module.exports = {
  start,
};
