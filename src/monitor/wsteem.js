////////////////////////////////////////////////////////////
//
// information (소개)
//

/*
  파일명 : wsteem.js

  설명 : 스팀 wraper 유틸

  최초작성일 : 2022.03.03
*/

////////////////////////////////////////////////////////////
//
// require (라이브러리 로딩)
//
const steem = require("steem");
const { sleep, time } = require("../util/wetc");
const API_URL = process.env.API_URL || "https://api.steemit.com";
steem.api.setOptions({ url: API_URL }); // default 가 https://steemd.steemit.com 라서 반드시 재 설정 해야 됨

////////////////////////////////////////////////////////////
//
// const (상수정의)
//
const MAX_RETRY = process.env.MAX_RETRY || 3;

////////////////////////////////////////////////////////////
//
// let (변수정의)
//

/**
 * API 호출 오류 시 재 호출 처리를 수행한다
 * @param {Function} fn 호출 함수
 * @param {string} alias 별칭
 * @param {number} retry 재시도 횟수
 * @param  {...any} params 파라미터 목록
 * @returns Promise
 */
async function _recall(fn, alias = "not_defined", retry = 0, ...params) {
  alias = alias == "not_defined" ? fn.name : alias;
  try {
    let res;
    if (params) {
      res = await fn(...params);
    } else {
      res = await fn();
    }
    return res;
  } catch (err) {
    retry++;
    if (retry > MAX_RETRY) {
      throw new Error(`${alias} retry over ${MAX_RETRY}`); // fn.name 이 ret 이런식이라 그냥 식별용 alias 를 사용하기로 함.
    }
    await sleep();
    console.error(`${alias} is recalled : ${retry}`, err.toString());
    return _recall(fn, alias, retry, ...params);
  }
}

////////////////////////////////////////////////////////////
//
// private function (비공개 함수) 함수명을 _(언더스코어) 로 시작
//

/**
 * 입력받은 블록목록 정보에서 operations 정보만 추출한다
 * @param {Object[]} blocks 블록정보
 */
function getOperations(blocks) {
  // CHECK : virtual block
  // 가상 블록은 다른 방식으로 가져와야 됨에 유의
  let operations = [];
  for (let b of blocks) {
    let block_timestamp = b.timestamp;
    let block_timestamp_kr = time(block_timestamp);
    let block_id = b.block_id;

    for (let t of b.transactions) {
      let block_num = t.block_num;
      let transaction_num = t.transaction_num;
      let transaction_id = t.transaction_id;

      for (let o of t.operations) {
        let operation_type = o[0];
        let operation_data = o[1];

        operations.push({
          block_timestamp_kr,
          block_timestamp,
          block_id,
          block_num,
          transaction_id,
          transaction_num,
          operation_type,
          operation_data,
        });
      }
    }
  }

  // 정렬 : block_num asc, transaction_num asc
  operations.sort((a, b) => {
    if (a.block_num == b.block_num) {
      return a.transaction_num - b.transaction_num;
    }
    return a.block_num - b.block_num;
  });

  return operations;
}

////////////////////////////////////////////////////////////
//
// public function (공개 함수)
//

/**
 * 보팅을 수행한다
 * @param {string} wif 보팅 계정 포스팅키
 * @param {string} voter 보팅 계정명
 * @param {string} author 보팅 할 글의 author
 * @param {string} permlink 보팅 할 글의 permlink
 * @param {number} weight 보팅 weight, 10000(1e4) 이 100%임
 * @returns Promise
 */
async function vote(wif, voter, author, permlink, weight = 1e4) {
  return await _recall(
    steem.broadcast.vote,
    "voteAsync",
    0,
    wif,
    voter,
    author,
    permlink,
    weight
  );
}

/**
 * 컨텐츠 정보를 가져온다
 * @param {string} author 계정명
 * @param {string} permlink 영구링크
 * @param {string} voter 보팅사용자, 해당 사용자가 보팅을 했는지 여부를 파악하기 위함
 * @returns Promise
 */
async function getContent(author, permlink, voter = "-1") {
  let res = await _recall(
    steem.api.getContentAsync,
    "getContent",
    0,
    author,
    permlink
  );
  // added
  // voted : voter 가 해당 글에 보팅 했는지 여부
  // changed : 컨텐츠 수정여부
  let voted =
    res.active_votes.filter((x) => x.voter == voter).length == 0 ? false : true;
  return { ...res, changed: res.created !== res.last_update, voted, voter };
}

/**
 * 최신 블록 정보를 반환한다
 * @param {boolean} is_head 해드 블록여부, 기본 true
 * @returns number
 */
async function getBlockHeader(is_head = true) {
  let res = await getDynamicGlobalPropertiesAsync();
  return is_head ? res.head_block_number : res.last_irreversible_block_num;
}

/**
 * 전역 설정 정보를 가져온다
 * @returns Promise
 */
async function getDynamicGlobalPropertiesAsync() {
  return await _recall(
    steem.api.getDynamicGlobalPropertiesAsync,
    "getDynamicGlobalPropertiesAsync"
  );
}

/**
 * 블록 정보를 가져온다
 * @param {number} block_num 블록번호
 * @returns Promise
 */
async function getBlock(block_num) {
  return await _recall(steem.api.getBlockAsync, "getBlock", 0, block_num);
}

/**
 * 블록 목록정보를 가져온다
 * 200개 정도를 한번에 읽으면 반드시 3초 이상 SLEEP 을 해야 됨에 유의
 * @param {number} start_block
 * @param {number} end_block
 * @returns Promise
 */
async function getBlocks(start_block, end_block) {
  let blocks = [];
  if (!end_block) {
    end_block = start_block;
  }
  for (let i = start_block; i <= end_block; i++) {
    blocks.push(getBlock(i));
  }
  return Promise.all(blocks);
}

////////////////////////////////////////////////////////////
//
// exports (외부 노출 함수 지정)
//

module.exports = {
  getBlockHeader,
  getDynamicGlobalPropertiesAsync,
  getBlock,
  getBlocks,
  getOperations,
  getContent,
  vote,
};
