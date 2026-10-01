// ともしびアイランド — 技の 表示名（名前の 法則）。技IDは 変えない（セーブ互換）
// 法則：根（系統）＋ 前に「オ」（強い）「ゼ」（最上位）＋ 後ろに「ス」（全体）。武器の技は 根＋「斬り」「突き」「打ち」「の舞」など（漢字あり）
// 強さの 目安：1体は 威力1.8〜2.9＝オ・3.0以上＝ゼ ／ 全体は 1.4〜1.89＝オ・1.9以上＝ゼ ／ 回復は 量で 同じように
// 根：ホムラ（炎）ミナモ（水）カザネ（風）イワネ（大地）コノハ（草）アカリ（光）カゲリ（闇）ヌクミ（回復）キヨメ（治す）カエリビ（復活）
//     マドロミ（眠り）シガラミ（しびれ・鈍り）ドクミ（毒）マモリビ（守り）フルイビ（力）ハヤビ（速さ）
'use strict';
(() => {
  const N = {
    // ソラ（剣）
    tomoshi: 'ホムラ斬り', issen: 'アカリの舞', kenbu: 'オホムラの舞', i_soraUlt: 'ゼホムラ斬り', mamori: 'マモリビ',
    // ミオ
    iyashi: 'ヌクミス', nemuri: 'マドロミ', kiyome: 'オアカリ', hagemashi: 'フルイビ', hoshiuta: 'アカリス',
    // リク（槍）
    tsuranuki: 'つらぬき', kazaguruma: 'カザネの舞', ranbu: 'オカザネ突き', i_rikuUlt: 'ゼカザネ突き', i_shigarami: 'シガラミ突き',
    // サナ
    hoshiyomi: 'オアカリ', inori: 'ヌクミス・キヨメ', hoshifuri: 'オアカリス', seiun: 'オヌクミス・キヨメ', i_sanaUlt: 'ゼアカリス',
    // ハル
    kazeyomi: 'オカザネ', oikaze: 'ハヤビ', tatsumaki: 'オカザネス', soyokaze: 'ヌクミス・キヨメ', amatsukaze: 'オカザネス', i_haruUlt: 'ゼカザネス',
    // カイト（錨）
    toudai: 'オアカリ', ikari: 'オミナモ打ち', shiosai: 'マモリビ', oonamigiri: 'オミナモの舞', tomoshibi: 'オアカリス', i_kaitoUlt: 'ゼミナモ打ち',
    // みんなの 固有わざ
    i_nukumi: 'ヌクミ', i_kiyome: 'キヨメス', i_kaeribi: 'カエリビ', i_daikaeribi: 'オカエリビ',
    // 仲間モンスター・ぞくせいの わざ
    fuwafuwa: 'ヌクミ', iwaotoshi: 'イワネ', mizudeppou: 'ミナモ', matataki: 'アカリス', hinoko: 'ホムラ', honoo: 'ホムラス', mizu: 'ミナモ', nami: 'ミナモス',
    happa: 'コノハ', tsuta: 'コノハ・シガラミ', iwa: 'イワネ', jishin: 'イワネス', kaze: 'カザネ', arashi: 'カザネス', yami: 'カゲリ', ginga: 'オアカリス',
    iyashikaze: 'ヌクミス・キヨメ', inazuma: 'カザネス・シガラミ', nemurigumo: 'マドロミス', yami_e: 'カゲリス', dokugiri: 'カゲリス・ドクミ', dokubari: 'コノハ・ドクミ',
    sumi: 'カゲリ・シガラミ', awadama: 'ミナモ', sango: 'イワネ', chouchin: 'アカリス', uzushio: 'オミナモス',
    // 敵の わざ（体の 動きは そのまま、ぞくせいの わざは 法則どおり）
    e_mizu: 'ミナモ', e_hoshi: 'アカリス', jishin_e: 'イワネス', hoshi_e: 'アカリス', arashi_e: 'カザネス', jinarashi: 'イワネス', tsunami: 'ミナモス', tobari: 'カゲリス',
    yaminohonoo: 'オホムラ', tomoshikui: 'トモシクライ', tokoyo: 'カゲリス', nageki: 'マドロミス', ryuusei: 'アカリス', raijin: 'カザネス・シガラミ',
    daijishin: 'ゼイワネス', eiennoyoru: 'オカゲリス', hoshinotaki: 'オアカリス', daitatsumaki: 'オカザネス・シガラミ', tenkui: 'テンクライ', tenkuiX: 'ゼテンクライ',
    seikou: 'オアカリス', oonami: 'オミナモス', denkou: 'アカリス・シガラミ', kurasumi: 'カゲリス・ドクミ', fukamikui: 'フカミクライ', shinkai: 'オミナモス', kaiko: 'ゼミナモス',
    // 職業の わざ
    j_hibana: 'ホムラ打ち', j_hotaru: 'ヌクミ', j_akari: 'アカリの舞', j_tomoshiuchi: 'オアカリ打ち',
    j_kabuto: 'かぶと割り', j_otakebi: 'フルイビ', j_nagi: 'なぎはらい', j_teppeki: 'マモリビ', j_gekiretsu: '激烈斬',
    j_hinotama: 'オホムラ', j_mizutsubute: 'ミナモス', j_raiun: 'オカザネス・シガラミ', j_gouka: 'オホムラス', j_hoshikuzu: 'ゼアカリス',
    j_iyashite: 'オヌクミ', j_kiyokaze: 'キヨメス', j_megumi: 'オヌクミス・キヨメ', j_seika: 'オアカリス',
    j_kagenui: 'シガラミ打ち', j_hayabusa: 'オカザネ斬り', j_yamiuchi: 'ゼカゲリ斬り',
    j_seiken: 'せいけん突き', j_renkyaku: 'オイワネ蹴り', j_kikou: 'オヌクミ', j_senpuu: 'オカザネの舞', j_touken: 'ゼホムラ拳',
    j_komori: 'オマドロミ', j_nagiuta: 'ヌクミス・キヨメ', j_gassou: 'オアカリス・フルイビ',
    j_yuuki: 'ヌクミス・フルイビ', j_raikou: 'オカザネ斬り・シガラミ', j_hikaritate: 'マモリビ・キヨメ', j_tenkuu: 'ゼアカリの舞', j_gokui: 'ゼアカリ斬り',
  };
  Object.assign(DATA.skillNames = DATA.skillNames || {}, N);
  for (const [k, n] of Object.entries(N)) if (DATA.skills[k]) DATA.skills[k].name = n;
})();
