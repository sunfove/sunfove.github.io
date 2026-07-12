---
title: FDTD数据导出到Matlab作图
categories: 软件
tags:
  - FDTD
  - Matlab
abbrlink: b1a2cde6
date: 2019-10-05 23:46:33
updated:
top: 
---
&emsp;&emsp;FDTD计算得到的电场分布，但是FDTD通过另存为jpg或者截屏所得到的图片分辨率很低，得到的图片往往不能直接使用。因此，可以通过脚本输入到Maltab，然后再利用Matlab处理图片并输出。
&emsp;&emsp;但是将数据从FDTD输出到Matlab中，并不是想象中那么简单，经历了好几次坑，反复摸索之后，得到了一种比较可行的方案，介绍如下。
<!-- more -->

### 1. FDTD原始结果
&emsp;&emsp;这里我们选用三角纳米片的电场分布仿真结果进行举例。图1是FDTD直接输出的结果（截图），可以明显看出，x方向和y方向的比例并不相同，而且不容易调节成比例尺相同，我目前有两个可行的方案可以解决这个问题，一种是先建立一个方形的图片，利用签字笔在电脑屏幕上画出方形的边界，然后再反复调节FDTD的图片，使其边界和画出的边界重合；第二种方案相对更精准也更方便，借用Snipaste截图软件创建一个方形的贴图，这个好处是这个贴图可以一直置于顶层，然后再调节FDTD中图片的边界即可。这两种方案都是调节好之后进行截图，因为直接另存，FDTD输出的图片更加模糊，而且也没有在FDTD Solutions软件中找到可以设置分辨率的选项（FDTD Solutions版本为2018版），因此可以使用高分辨率截图软件或者较高分辨率的软件，然后将图片放到PS或者AI中进行分辨率的进一步调节。FDTD中能够调节的着实比较少，很有必要继续调整。
![图1 FDTD结果](https://suncos-01-1254144885.cos.ap-shanghai.myqcloud.com/Hexo/FDTD%E6%95%B0%E6%8D%AE%E5%AF%BC%E5%87%BA%E5%88%B0Matlab%E4%BD%9C%E5%9B%BE1.png)

### 2. FDTD结果导出到Matlab
&emsp;&emsp;FDTD数据导入到Matlab主要参考Lumerical官网的介绍文档[matlabsave](https://kb.lumerical.com/ref_scripts_matlabsave.html)。
&emsp;&emsp;可以通过如下脚本实现电场的读取：
```
E=getresult("z=0","E");
E2=getelectric("z=0");
E1=sqrt(E2);
matlabsave("tri120.mat",E,E1);
```
其中E得到的是一个struct结果:
```
  包含以下字段的 struct:

                    E: [48841×3 double]
    Lumerical_dataset: [1×1 struct]
                    f: 4.2827e+14
               lambda: 7.0000e-07
                    x: [221×1 double]
                    y: [221×1 double]
                    z: 0
```
struct中E是一个包含三个x, y, z三个方向的电场分布，是矢量信息，而通过getelectric并开根号得到的是电场的标量数值。值得一说的是，对结构体struct中内容的调用可以采用E.x等命令进行直接读取。
值得注意的是，FDTD和Matlab采用的矩阵规则不同，输出后的结果需要进行非共轭转置，才能够和FDTD的结果进行对应。
x，y， E 等的信息除了利用getdata或getresult获取以外，也可以通过右键单击，将结果输出到脚本，可以得到相同的效果。
![图2 导出x, y 信息](https://suncos-01-1254144885.cos.ap-shanghai.myqcloud.com/Hexo/FDTD%E6%95%B0%E6%8D%AE%E5%AF%BC%E5%87%BA%E5%88%B0Matlab%E4%BD%9C%E5%9B%BE2.png)

### 3. Matlab作图
将电场结果，x，y，z数据导出到matlab中之后，作图可以有多种方案，contour，contourf，pcolor等均可以实现，pcolor更为方便。![图3 pcolor处理结果](https://suncos-01-1254144885.cos.ap-shanghai.myqcloud.com/Hexo/FDTD%E6%95%B0%E6%8D%AE%E5%AF%BC%E5%87%BA%E5%88%B0Matlab%E4%BD%9C%E5%9B%BE3.png)contourf和pcolor的语句如下：
```
[C,h] = contourf(E,M)    %counterf, M越大，越精细
h = pcolor(x,y,E)        %pcolor
```
如图3为pcolor输出的结果。作图后，仍需进行如下调整：
```
set(h,'LineStyle','none');     %线型设置为无
colorbar                       %色标
colormap jet                   %色标模式选用jet
axis equal                     %x, y 等比例尺
```
> 参考：[2D image plots](https://kb.lumerical.com/ref_scripts_tutorial_matlab_2d_plotting.html)
&emsp;&emsp;&emsp;[matlabsave](https://kb.lumerical.com/ref_scripts_matlabsave.html)




