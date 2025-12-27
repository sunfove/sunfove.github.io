---
title: Potplayer看在线视频
categories: 技巧
tags:
  - 技巧
  - potplayer
abbrlink: 9e4666c0
date: 2019-11-19 23:21:16
description:
---
<img src="https://suncos-01-1254144885.cos.ap-shanghai.myqcloud.com/Hexo/Potplayer%E7%9C%8B%E5%9C%A8%E7%BA%BF%E8%A7%86%E9%A2%910.png" style="width: 90%">
<!--more-->
[Potplayer](https://potplayer.daum.net/)作为一个PC端非常好用的视频播放器，常见的视频格式全都支持，其他功能也是非常强大。这里我主要介绍一下利用potplayer观看在线视频，包括两种类型：电视台视频和直播平台视频。


{% tabs potplayer  %}
<!-- tab 电视视频 -->

可以通过potplayer观看央视各个频道、地方电视台等众多电视视频，播放源可以从网上搜索potplayer直播源，下载下来以后，直接用potplayer打开即可。
![电视源](https://suncos-01-1254144885.cos.ap-shanghai.myqcloud.com/Hexo/Potplayer%E7%9C%8B%E5%9C%A8%E7%BA%BF%E8%A7%86%E9%A2%911.png)
<!-- endtab -->
<!-- tab 直播视频 -->
首先安装[streamlink](https://github.com/streamlink/streamlink)，然后打开电脑的命令提示符（win+R输入cmd）或者windows powershell，输入`streamlink --player "播放器路径" 直播网址 best `
例如：`streamlink --player "D:\Program Files\DAUM\PotPlayer\PotPlayerMini64.exe" https://www.huya.com/11602046 best`
回车就发现自动打开potplayer并播放了直播内容。
还可以将以上代码写到txt文件中，然后保存修改后缀为bat格式，双击即可观看。
![直播源](https://suncos-01-1254144885.cos.ap-shanghai.myqcloud.com/Hexo/Potplayer%E7%9C%8B%E5%9C%A8%E7%BA%BF%E8%A7%86%E9%A2%912.png)

<!-- endtab -->

{% endtabs %} 

{% label success@目前网上Potplayer下载网站比较混杂，一般需要科学上网才能在官网下载。网盘中提供potplayer、streamlink安装包和一些视频源文件。 %}
{% note success no-icon %}百度网盘：https://pan.baidu.com/s/1N9thLZ2Bju5qAsfzOxa6Zg 
提取码：mwov 
{% endnote %}

> 参考：[用streamlink配合potplayer轻松愉快观看各大直播网站直播](https://www.52pojie.cn/thread-758819-1-1.html)
> &emsp;&emsp;&emsp;[potplayer电视直播源(使用电脑看国外电视节目) 免费版 附使用教程](https://www.jb51.net/softs/692111.html)