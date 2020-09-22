# tsg-live-controller

博多市が作った、OBS のリモート操作ソフト。

この README は、hideo54 が TSG LIVE! 5 準備にあたって、博多市の話も聞きつつ、独自に作ったもの。
TSG LIVE! 5 にて動作検証済み。

## 環境準備

* [obs-websocket](https://github.com/Palakis/obs-websocket) を導入

### YouTube のコメントを拾う

* [マルチコメントビュアー](https://ryu-s.github.io/app/multicommentviewer) を、[公式の「導入方法」](https://github.com/CommentViewerCollection/MultiCommentViewer/wiki/%E5%B0%8E%E5%85%A5%E6%89%8B%E9%A0%86) を参考に導入
* [HTML5コメントジェネレーター](https://www.kilinbox.net/2016/01/HCG.html) を導入
* マルチコメントビュアーでコメジェネ連携を設定
* .env に comment.xml のパスを指定

## OBS の準備のしかた

次の素材を準備する:
* 背景のキラキラ (宇宙)
* 右側のデザイン (Drive の Illustrator ファイル参照)
* イントロ動画

OBS では、これらに加えて以下を被せる:

* 各チームの点数 (テキスト)
* 左側に映す画面 (オンライン開催の場合、[hideo54 作 meet-live をお試しあれ](https://github.com/hideo54/meet-live))
* overlay (ブラウザ): 下で説明
* 試合ステータス表示 (ブラウザ): 下で説明

### overlay

次の機能がある:
* 以下4点のカルーセル表示:
    * 出演者一覧 ([live-configs.js](/live-configs.js) から生成した HTML)
    * TSG LIVE! ウェブサイトの案内 ([画像](/images/carousel1.png))
    * Twitter ハッシュタグ #tsg_live の案内 ([画像](/images/carousel2.png))
    * アンケートページ ([画像](/images/carousel3.png))
* 以下3箇所から取得したコメントの表示
    * TSG LIVE! ウェブサイト
    * Twitter (#tsg_live)
    * YouTube Live 生放送
* 残り時間のカウントダウンの表示
* 得点やプレイヤーコメントの表示
    * これのために、Cloud Functions や Firestore の準備が必要。

`http://localhost:8080/overlay.html?config=:key` を参照。

key: [live-configs.js](/live-configs.js) の object の key.

ちなみに、TSG LIVE! 5 での key は以下の通り:
* opening
* game
* golf
* marathon
* game2
* golf2
* ctf
* hacking

### 試合ステータス

TSG LIVE! 5 では、次のようにした:
* コードゴルフ: ブラウザでゴルフのサイトの盤面ページを映す
* マラソン: このリポジトリ内に [ai.html](/ai.html) がある。[tsg-ai-arena](https://github.com/hakatashi/tsg-ai-arena) の API を叩いている。
* CTF: このリポジトリ内に [ctf.html](/ctf.html) がある。ctfd の API を叩いている。

## リモコン操作

http://localhost:8080

* 「ライブ中シーン」「ライブ終了シーン」を選択しておく
* 「ライブ開始時刻」を設定。
* 「カウント開始時刻」「カウント時間」を設定。
    * オープニングトーク: 「カウント開始時刻」: 削除。カウント時間は1分とかでいいよ。
    * ゲーム: 「カウント開始時刻」: 削除。カウント時間は90分。始めからカウント音が鳴り、またカンカン音は鳴らないよう設定されている。
    * ゴルフ、マラソン、CTF: 開始時刻+3分。カウント時間は75分。
* 「自動モード」を押す。これで「ライブ終了」以外の仕事はなくなった。

一応直前の overlay のリロードを忘れないでくれ。

流れは以下の通り:
* 1分前までには自動モードを有効化しておくこと
* 開始10秒前ごろに黒色の画面に遷移。これはイントロ動画への移行を綺麗にするため。
* 0秒になると、(シーンをそう設定しておけば) イントロ動画が流れ始め、流れ終わるとフェードアウトする。
* TSG LIVE! 5 の場合、10秒から話し始めるとちょうどいい
* わちゃわちゃ
* 終わったら「ライブ終了」を押す。次が始まるまでにシーンを準備しておこう!

万一途中で overlay にバグが見つかってリロードすると、タイマーの数字がリセットされてしまう。そんな時は焦らず、コントローラの「カウント時間」を残り時間に設定して、ちょうど00秒になった時にポチッと押せば、その時間からのカウントを始められる。