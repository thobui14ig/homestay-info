import { HttpsProxyAgent } from "https-proxy-agent";
import { ProxyEntity } from "src/application/proxy/entities/proxy.entity";
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import { LinkEntity } from "src/application/links/entities/links.entity";
import { GroupedLinksByType } from "src/application/monitoring/monitoring.service.i";

dayjs.extend(utc);

function normalizePhoneNumber(text: string) {
    const match = text.match(/o\d{3}[.\s]?\d{4}[.\s]?\d{2}/i);
    if (match) {
        return match[0]
            .replace(/^o/i, '0')
            .replace(/[.\s]/g, '');
    }
    return null;
}

function extractPhoneNumber(text: string) {
    // Ưu tiên bắt theo pattern dạng `o123 4567 89` trước
    const normalized = normalizePhoneNumber(text);
    if (normalized) return normalized;

    // Sau đó mới dùng backup: loại bỏ ký tự và tìm theo đầu số
    let cleanedText = text.replace(/o/gi, '0');
    cleanedText = cleanedText.replace(/[^0-9]/g, '');

    const validNetworkCodes = [
        '099', '098', '097', '096', '095', '094', '093', '092', '091', '090',
        '089', '088', '087', '086', '085', '083', '082',
        '081', '080', '079', '078', '077', '076', '075', '074',
        '073', '072', '071', '070', '069', '068', '067', '066',
        '065', '064', '063', '062', '061', '060',
        '059', '058', '057', '056', '055', '054', '053', '052', '051', '050',
        '039', '038', '037', '036', '035', '034', '033', '032', '031', '030'
    ];

    for (const code of validNetworkCodes) {
        const index = cleanedText.indexOf(code);
        if (index !== -1) {
            const phoneNumber = cleanedText.slice(index, index + 10);
            if (phoneNumber.length === 10) {
                return phoneNumber;
            }
        }
    }

    return null;
}

function extractFacebookId(url: string): string | null {
    const patterns = [
        /\/videos\/(\d+)/,                         // video id
        /\/posts\/(pfbid\w+)/,                     // post with pfbid
        /facebook\.com\/(\d{10,})$/,               // plain user/page ID
        /facebook\.com\/(pfbid\w+)/,               // post with pfbid in URL directly
        /story\.php\?story_fbid=(\d+)/,            // story_fbid in query params
        /permalink\.php\/\?story_fbid=(\d+)/,      // story_fbid in permalink.php
        /permalink\.php\/?\?story_fbid=(\d+|pfbid\w+)/,
        /\/reel\/(\d+)/,                            // reel id
        /facebook\.com\/\d+\/posts\/(\d+)/,
        /comment_id=(\d+)/,                          // comment_id in query params
        /fbid=(\d+)/,                                // fbid in query params
        /facebook\.com\/[^\/]+\/posts\/(\d+)/,
        /multi_permalinks=(\d+)/,                     // group multi_permalinks
        /[?&]v=(\d+)/,                                // watch?v=... & watch/live?v=...
        /groups\/[^\/]+\/permalink\/(\d+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }

    return null;
}

function getHttpAgent(proxy: ProxyEntity) {
    const proxyArr = proxy?.proxyAddress.split(':')
    const agent = `http://${proxyArr[2]}:${proxyArr[3]}@${proxyArr[0]}:${proxyArr[1]}`
    const httpsAgent = new HttpsProxyAgent(agent);

    return httpsAgent;
}

function changeCookiesFb(cookies: string): Record<string, string> {
    cookies = cookies.trim()?.replace(/;$/, '');
    const result = {};

    try {
        cookies
            .trim()
            .split(';')
            .forEach((item) => {
                const parts = item.trim().split('=');
                if (parts.length === 2) {
                    result[parts[0]] = parts[1];
                }
            });
        return result;
    } catch (_e) {
        cookies
            .trim()
            .split('; ')
            .forEach((item) => {
                const parts = item.trim().split('=');
                if (parts.length === 2) {
                    result[parts[0]] = parts[1];
                }
            });
        return result;
    }
}

function formatCookies(cookies: Record<string, string>): string {
    return Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
}

function decodeCommentId(encodedStr) {
    try {
        const decoded = Buffer.from(encodedStr, 'base64').toString('utf-8');

        const match = decoded.match(/^comment:.*_(\d+)$/);

        if (match && match[1]) {
            return match[1];
        } else {
            return null;
        }
    } catch (error) {
        console.error('Lỗi giải mã comment ID:', error.message);
        return null;
    }
}

const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
}


const handleDataComment = (response: any) => {
    const comment =
        response?.data?.data?.node?.comment_rendering_instance_for_feed_location
            ?.comments.edges?.[0]?.node;
    if (!comment) return null
    const commentId = decodeCommentId(comment?.id) ?? comment?.id

    const commentMessage =
        comment?.preferred_body && comment?.preferred_body?.text
            ? comment?.preferred_body?.text
            : 'Sticker';

    const phoneNumber = extractPhoneNumber(commentMessage);
    const userNameComment = comment?.author?.name;
    const commentCreatedAt = dayjs(comment?.created_time * 1000).utc().format('YYYY-MM-DD HH:mm:ss');
    const serialized = comment?.discoverable_identity_badges_web?.[0]?.serialized;
    let userIdComment = serialized ? JSON.parse(serialized).actor_id : comment?.author.id
    const totalCount = response?.data?.data?.node?.comment_rendering_instance_for_feed_location?.comments?.total_count
    const totalLike = response?.data?.data?.node?.comment_rendering_instance_for_feed_location?.comments?.count
    userIdComment = userIdComment

    return {
        commentId,
        userNameComment,
        commentMessage,
        phoneNumber,
        userIdComment,
        commentCreatedAt,
        totalCount,
        totalLike
    };
}

function getRandomNumber() {
    return Math.floor(Math.random() * 1000) + 1;
}

function groupPostsByType(links: LinkEntity[]): GroupedLinksByType {
    return links.reduce((acc, item) => {
        if (!acc[item.type]) {
            acc[item.type] = [];
        }
        acc[item.type].push(item);
        return acc;
    }, {} as Record<'public' | 'private', typeof links>);
}

export {
    extractPhoneNumber, extractFacebookId, getHttpAgent, changeCookiesFb, formatCookies, decodeCommentId, delay, handleDataComment, getRandomNumber, groupPostsByType
}