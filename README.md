# tsg-live-controller

hakatashi が作った、OBS のリモート操作ソフト。

## 環境準備

* [obs-websocket](https://github.com/Palakis/obs-websocket) を導入

### YouTube のコメントを拾う

* [マルチコメントビュアー](https://ryu-s.github.io/app/multicommentviewer) を、[公式の「導入方法」](https://github.com/CommentViewerCollection/MultiCommentViewer/wiki/%E5%B0%8E%E5%85%A5%E6%89%8B%E9%A0%86) を参考に導入
* [HTML5コメントジェネレーター](https://www.kilinbox.net/2016/01/HCG.html) を導入
* マルチコメントビュアーでコメジェネ連携を設定
* .env に comment.xml のパスを指定

## overlay.html

localhost:8080/overlay.html?config=(企画ID: live-configs.js の key)

ちなみに、TSG LIVE! 5 での key は以下の通り:
* opening
* game
* golf
* marathon
* game2
* golf2
* ctf
* hacking

## リモコン操作

localhost:8080

* 「ライブ中シーン」「ライブ終了シーン」を選択しておく
* 「ライブ開始時刻」を設定。
* 「カウント開始時刻」「カウント時間」を設定。
    * オープニングトーク: 「カウント開始時刻」: 削除。カウント時間は1分とかでいいよ。
    * ゲーム: 「カウント開始時刻」: 削除。カウント時間は90分。始めからカウント音が鳴り、またカンカン音は鳴らないよう設定されている。
    * ゴルフ、マラソン、CTF: 開始時刻+3分。カウント時間は75分。
* 「自動モード」を押す。これで「ライブ終了」以外の仕事はなくなった。

一応直前の overlay のリロードを忘れないでくれ

流れは以下の通り:
* 1分前までには自動モードを有効化しておくこと
* 開始10秒前ごろに黒色の画面に遷移。これはイントロ動画への移行を綺麗にするため。
* 0秒になると、(シーンをそう設定しておけば) イントロ動画が流れ始め、流れ終わるとフェードアウトする。
* TSG LIVE! 5 の場合、10秒から話し始めるとちょうどいい
* わちゃわちゃ
* 終わったら「ライブ終了」を押す。次が始まるまでにシーンを準備しておこう!