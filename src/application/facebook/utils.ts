import { v4 as uuidv4 } from 'uuid';

export const getHeaderComment = (fbUrl: string) => {
  return {
    authority: 'www.facebook.com',
    method: 'POST',
    path: '/api/graphql/',
    scheme: 'https',
    accept: '*/*',
    'accept-language':
      'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
    'content-type': 'application/x-www-form-urlencoded',
    dpr: '1.25',
    cookie:
      'dpr=1.25; sb=VEdzZ-YVx2zM4XwojJTWKbIc; datr=VEdzZyiQElyyh9HuzjaD5FQL; wd=816x722',
    origin: fbUrl,
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
    'viewport-width': '982',
    'x-asbd-id': '129477',
    'x-fb-friendly-name': 'CommentListComponentsRootQuery',
    'x-fb-lsd': 'AVqpeqKFLLc',
  };
};

export const getBodyComment = (postId: string) => {
  return {
    av: '0',
    __aaid: '0',
    __user: '0',
    __a: '1',
    __req: 'h',
    dpr: '1',
    __ccg: 'GOOD',
    __rev: '1019099659',
    __s: 'nvbf2u:n9bd15:vnouit',
    __hsi: '7454361444484971104',
    __dyn:
      '7xeUmwlEnwn8yEqxemh0no6u5U4e1Nxt3odEc8co2qwJyE24wJwpUe8hw2nVE4W0te1Rw8G11wBz83WwgEcEhwnU2lwv89k2C1Fwc60D85m1mzXw8W58jwGzE2ZwJK14xm3y1lU5O0Gpo8o1mpEbUGdwda3e0Lo4q58jwTwNwLwFg2Xwkoqwqo4eE7W1iwo8uwjUy2-2K0UE',
    __csr:
      'glgLblEoxcJiT9dmdiqkBaFcCKmWEKHCJ4LryoG9KXx6V4VECaG4998yuimayo-49rDz4fyKcyEsxCFohheVoogOt1aVo-5-iVKAh4yV9bzEC4E8FaUcUSi4UgzEnw7Kw1Gp5xu7AQKQ0-o4N07QU2Lw0TDwfu04MU1Gaw4Cw6CxiewcG0jqE2IByE1WU0DK06f8F31E03jTwno1MS042pA2S0Zxaxu0B80x6awnEx0lU3AwzxG3u0Ro1YE1Eo-32ow34wCw9608vwVo19k059U0LR08MNu8kc05lCabxG0UUjBwaadBweq0y8kwdh0kS0gq2-0Dokw1Te0O9o1rsMS1GKl1MM0JSeCa014aw389o1pOwr8dU0Pu0Cix60gR04YweK1raqagS0UA08_o1bFjj0fS42weG0iC0dwwvUuyJ05pw4Goog1680iow2a8',
    __comet_req: '15',
    lsd: 'AVqpeqKFLLc',
    jazoest: '2929',
    __spin_r: '1019099659',
    __spin_b: 'trunk',
    __spin_t: '1735603773',
    fb_api_caller_class: 'RelayModern',
    fb_api_req_friendly_name: 'CommentListComponentsRootQuery',
    variables: `{
        "commentsIntentToken": "RECENT_ACTIVITY_INTENT_V1",
        "feedLocation": "PERMALINK",
        "feedbackSource": 2,
        "focusCommentID": null,
        "scale": 1,
        "useDefaultActor": false,
        "id": "${postId}",
        "__relay_internal__pv__IsWorkUserrelayprovider": false
      }`,
    server_timestamps: 'true',
    doc_id: '9051058151623566',
  };
};

const getHeaderToken = (fbUrl: string) => {
  return {
    authority: 'www.facebook.com',
    accept: '*/*',
    'accept-language':
      'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
    'content-type': 'application/x-www-form-urlencoded',
    dnt: '1',
    origin: fbUrl,
    'sec-ch-ua': '"Chromium";v="117", "Not;A=Brand";v="8"',
    'sec-ch-ua-full-version-list':
      '"Chromium";v="117.0.5938.157", "Not;A=Brand";v="8.0.0.0"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-model': '""',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
    'x-fb-friendly-name': 'useCometConsentPromptEndOfFlowBatchedMutation',
  };
};

const getBodyToken = (cUser: string, fbDtsg: string, appId: string) => {
  return {
    av: cUser,
    __user: cUser,
    fb_dtsg: fbDtsg,
    fb_api_caller_class: 'RelayModern',
    fb_api_req_friendly_name: 'useCometConsentPromptEndOfFlowBatchedMutation',
    variables: `{"input":{"client_mutation_id":"4","actor_id":"${cUser}","config_enum":"GDP_CONFIRM","device_id":null,"experience_id":"${uuidv4()}","extra_params_json":"{\\"app_id\\":\\"${appId}\\",\\"kid_directed_site\\":\\"false\\",\\"logger_id\\":\\"\\\\\\"${uuidv4()}\\\\\\"\\",\\"next\\":\\"\\\\\\"confirm\\\\\\"\\",\\"redirect_uri\\":\\"\\\\\\"https:\\\\\\\\\\\\/\\\\\\\\\\\\/www.facebook.com\\\\\\\\\\\\/connect\\\\\\\\\\\\/login_success.html\\\\\\"\\",\\"response_type\\":\\"\\\\\\"token\\\\\\"\\",\\"return_scopes\\":\\"false\\",\\"scope\\":\\"[\\\\\\"user_subscriptions\\\\\\"]\\",\\"steps\\":\\"{}\\",\\"tp\\":\\"\\\\\\"unspecified\\\\\\"\\",\\"cui_gk\\":\\"\\\\\\"[PASS]:\\\\\\"\\",\\"is_limited_login_shim\\":\\"false\\"}","flow_name":"GDP","flow_step_type":"STANDALONE","outcome":"APPROVED","source":"gdp_delegated","surface":"FACEBOOK_COMET"}}`,
    server_timestamps: true,
    doc_id: '6494107973937368',
  };
};

const getHeaderProfileFb = () => {
  return {
    authority: 'www.facebook.com',
    accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/jxl,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'cache-control': 'no-cache',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-model': '""',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
  };
};

const getHeaderProfileLink = () => {
  const headers = {
    "authority": "www.facebook.com",
    "method": "GET",
    "scheme": "https",
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
    "cache-control": "max-age=0",
    "dpr": "1.25",
    "priority": "u=0, i",
    "sec-ch-ua": '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "same-origin",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
  }
  const cookies = {
    "datr": "vxn_Zj2fqOZ1P07fvi8nPhKf",
    "sb": "vxn_ZlcV_Nbp124XgBM45zLL",
    "ps_l": "1",
    "ps_n": "1",
    "dpr": "1.25",
    "fr": "1d7OWZU4tToHabPiT.AWV8OfLuVxfMiIBEks0IKH0rnotI0uebNNLJ_w.BnruFE..AAA.0.0.Bnyp0_.AWWR4SZ7tKw",
    "wd": "654x730"
  }

  return { headers, cookies }
}

export { getHeaderToken, getBodyToken, getHeaderProfileFb, getHeaderProfileLink };
