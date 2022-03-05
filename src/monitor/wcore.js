////////////////////////////////////////////////////////////
//
// information (소개)
//

/*
  파일명 : wcore.js

  설명 : 모티터링 코어 함수

  최초작성일 : 2022.03.03
*/

////////////////////////////////////////////////////////////
//
// require (라이브러리 로딩)
//
const fs = require("fs");
const { getBlockHeader, getBlocks, getOperations } = require("../util/wsteem");
const { lpad } = require("../util/wstring");
const { sleep, now } = require("../util/wetc");

////////////////////////////////////////////////////////////
//
// const (상수정의)
//
const { ROOT_PATH, OPERATION_LIST } = require("../util/wconst");
const RETRY_SEC = process.env.RETRY_SEC || 3;

////////////////////////////////////////////////////////////
//
// let (변수정의)
//

////////////////////////////////////////////////////////////
//
// private function (비공개 함수) 함수명을 _(언더스코어) 로 시작
//

/**
 * 읽어들인 기본 정보 출력
 * @param {Object} settings 설정정보
 * @param {number} recent_block 최신블록번호
 */
function _printReadInfo(settings, recent_block) {
  // 읽어들인 기본 정보 출력
  let buffer = [];
  buffer.push(lpad("", 40, "="));
  buffer.push(lpad("recent block : ", 20) + settings.block);
  buffer.push(lpad("start block : ", 20) + settings.block);
  buffer.push(lpad("block gap : ", 20) + (recent_block - settings.block));
  buffer.push(lpad("block per read : ", 20) + settings.per);
  buffer.push(lpad("monitor count : ", 20) + settings.cmds.length);
  buffer.push(lpad("", 40, "="));
  for (let item of settings.cmds) {
    buffer.push(lpad("file : ", 20) + item.impl);
    buffer.push(lpad("operations : ", 20) + item.operations.join(", "));
    buffer.push(lpad("", 40, "="));
  }
  console.log(buffer.join("\n"));
}

/**
 * operation 기준 카운트 정보를 반환한다
 * @param {Object} operations 명령정보
 * @returns Object
 */
const _getMatch = (operations) => {
  if (!operations) {
    return { operations: "not exist" };
  }
  let result = {};

  for (let op of operations) {
    // contract
    let is_found_operation = false;
    for (let o of OPERATION_LIST) {
      if (op.operation_type == o) {
        result[o] = result[o] == undefined ? 1 : result[o] + 1;
        is_found_operation = true;
      }
    }
    if (!is_found_operation) {
      console.error(`unregistered operation ${op.operation_type}`);
    }
  }
  return result;
};

/**
 * operations 정보를 출력한다
 * @param {Object[]} operations 명령목록
 * @param {number} start_block 시작블럭
 * @param {number} end_block 종료블럭
 */
function _printOperations(operations, start_block, end_block) {
  console.log(
    `TIME : ${operations[0].block_timestamp_kr} ~ ${
      operations[operations.length - 1].block_timestamp_kr
    }`,
    `BLOCK : ${start_block} ~ ${end_block} LOADED (${
      end_block - start_block + 1
    })
      }`,
    `OPERATIONS : ${operations.length} (${JSON.stringify(
      _getMatch(operations)
    )})`
  );
}

/**
 * 읽어들인 설정 정보 기준으로 모니터링을 수행한다
 * @param {Object} settings 설정 정보
 */
async function _monitor(settings) {
  // 블록정보 설정
  let { per, block, cmds } = settings;
  let recent_block = await getBlockHeader();
  let start_block = block;
  let end_block =
    recent_block - start_block > per ? start_block + per - 1 : recent_block;

  // 유효성 검증 - 이미 읽어들인 블록정보인지 판단
  if (start_block > recent_block) {
    console.log(`${recent_block} is already read block`);
    await sleep(RETRY_SEC);
    return _monitor(settings);
  }

  // 블록 목록 정보를 읽어들인다
  let blocks = await getBlocks(start_block, end_block);
  let operations = getOperations(blocks);

  if (operations && operations.length > 0) {
    // operations 정보 출력
    _printOperations(operations, start_block, end_block);

    // 등록된 monitor 대상에게 (impl 폴더 하위) notify
    for (let cmd of cmds) {
      // 아래처럼 require 를 여러번 호출 한다 하더라도 init은 (즉시 실행함수 수행 등) 1번만 됨 :)
      let { notify } = require(`${ROOT_PATH}/impl/${cmd.impl}`);
      if (!notify || typeof notify !== "function") {
        // 반드시 notify 함수를 만들어 줘야 됨
        // 나중에 확장성을 위해 명시적으로 notify 함수를 지정하는 것으로 함.
        throw new Error(`${cmd.impl}.js must exports notify function.`);
      }

      // 매칭되는 operation_type 만 처리되도록 함
      let filtered = operations.filter((x) =>
        cmd.operations.includes(x.operation_type)
      );
      await notify(filtered);
    }
  }

  // 블록정보 업데이트
  settings.block = end_block + 1;
  fs.writeFileSync(
    `${ROOT_PATH}/saved/block.json`,
    JSON.stringify(
      {
        ...settings,
        recent: recent_block,
        gap: Math.max(recent_block - settings.block, 0),
        launched: now(),
      },
      null,
      2
    )
  );

  // 다음 모니터링 수행
  await sleep();
  _monitor(settings);
}

////////////////////////////////////////////////////////////
//
// public function (공개 함수)
//

/**
 * 읽어들인 설정 정보를 기반으로 모니터링을 수행한다
 * @param {Object} settings 설정정보
 */
async function monitor(settings) {
  let recent_block = await getBlockHeader();

  // 오류 또는 처음 시작한 경우 최근 블록으로 초기화
  // 관련 정보는 saved/block.json 으로 저장됨
  if (settings.block == 0) {
    settings.block = recent_block;
  }

  // 읽어들인 기본 정보 출력
  _printReadInfo(settings, recent_block);

  // 등록된 파일 기준으로 모니터링 수행
  _monitor(settings);
}

////////////////////////////////////////////////////////////
//
// exports (외부 노출 함수 지정)
//

module.exports = {
  monitor,
};
