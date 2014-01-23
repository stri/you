### `you`前端开发工具

#### 简述

> 一个简单，灵活的前端开发环境构建工具。只需简单的配置，就可以快速搭建一个功能众多的前端开发环境。

#### 特点：

* 它是基于`nodeJS`,能够安装 `nodeJS`的地方，都可以使用；
* 它是简单的，使用简单，配置简单；
* 它是灵活的，可以通过安装自定义插件，来扩展you工具；

#### 安装

	npm install you -g


### 初级篇

==============================

#### 使用：开发（以下只是简单的配置，更多配置：[配置](https://github.com/stri/you/blob/you.4.0.beta/config/default.json)）

1. 确定自己的开发环境空间目录,例如是:`/Users/mac/Documents/`,可以配置如下:

		you root /Users/mac/Documents/ -c

2. 确定服务使用的端口，默认为80,可以更改，如下
	
		you port 8080 -c

3. 确定自己开发中JS和CSS的合并方式和编译方式(这个适用于CSS，使用SASS和LESS)，如下

		// 假如使用的JS是$import(类Java的包引用方式)，则配置如下
		you js_package_depend_style import -c

		// 假如使用的CSS的编译方式是SASS
		you css_package_depend_style sass -c

3. 如果上一步使用的是`SASS`编译CSS时，都想通过.css后缀访问，则可设置如下:
		
		you export_by_css_style true -c
		
4. 可以使用了，启动服务。OK，已经完成。

		you -r 或 you --run
		

#### 使用：测试

测试时，我们对代码要合并、压缩、打包，会有如下需求：

1. 设置CSS和JS为需要压缩

		you css_compress true -c
		you js_compress true -c

2. 设置CSS中图片是否需求版本号，设置成功后，将会以文件的`md5`值作为其版本号

		you css_image_version true -c

#### 使用：上线

1. 设置要打包的目录

		you js_compress_path /page/ -c
		you css_compress_path /page/ -c

2. 设置打包出错时，是否忽略

		you remove_error_file true -c
3. 从SVN代码仓库中开发打包

		you http://svn /目录路径/ -d -u 帐号 -p 密码
	


==============================

### 高级篇

=============================
 > 如上，在使用时，要配置很多参数，如果要使用扩展插件的话，参数或许更多，这是不是太麻烦了，是的，但如果你使用导入配置功能，可以方便在各种配置的切换。

#### 导入自定义配置(支持http或https)

	you http://xxx.com/config.json --install --config 或
	you http://xxx.com/config.json -i -c 



>  默认配置的`js_package_depend_style`只支持`import`,`you`两种包合并方式，满足不了我自己的代码包合并方式呀？下面，介绍`you`强大的扩展性。

#### 工具也是对象

它是工具，但在代码上，它是一个对象，一个`you`对象，它由五大核心构建成来。

* 配置对象:`you.getConfigObject`
	
* 合并对象:`you.getCombineObject`
	
* Http服务对象:`you.getServerObject`
	
* 插件对象:`you.getPluginObject`
	
* 任务对象: `you.getTaskObject`

##### `you.getConfigObject`

* `getConfig([name],callback)`:获取配置参数,当`name`存在时，则获取的是`name`的值，例子：

		var configObject = you.getConfigObject();
		configObject.getConfig(function(data){
			console.log(data);
		});

* `setConfig(name,value[,force])`: 设置配置参数,默认只是修改已存在的参数，如果想要添加参数，则配置`force`为`true`

* `installConfig(uri,callback)`:导入配置文件

##### `you.getCombineObject(Opts[,callback])`

* `you.getCombineObject.pack`,包合并方式

* 参数`Opts`:

	* `config`:	配置参数
	* `file`: 要合并的文件
	
		* `path`: 文件的路径
		* `type`: 文件的类型
		* `contentType`: 文件的`contentType`
	
	* `req`: 请求的`request`（只要在有http服务的环境下存在）
	* `res`: 响应的`response`（只要在有http服务的环境下存在）
	
* 参数`callback`: 合并完的回调

##### `you.getServerObject`

暂不支持扩展

##### `you.getPluginObject`

* `install(uri,callback)`：安装插件

##### `you.getTaskObject`

包合并生成文件的任务对象


> 有几个对象，就可以方便扩展`you`，使用功能更强大


====================================
## 例一：做一个添加注释的插件

代码如下：

		module.exports = function(you) {
			var combine = you.getCombineObject();


			function addComment(Opts) {
				if (Opts.file.type == 'js') {
					return '// 这里JS注释\n';
				}

				if (Opts.file.type == 'css') {
					return '// 这里CSS注释\n';
				}
			};

			you.getCombineObject = function(Opts, callback) {
				return combine(Opts, function(code) {
					code = addComment(Opts) + code;
					callback && callback(code);
					return code;
				});
			}

			return you;
		};
		
		
假如它的URL为: [https://raw2.github.com/stri/you/you.4.0.beta/demo/addComment.js](https://raw2.github.com/stri/you/you.4.0.beta/demo/addComment.js)

则只需

	you install https://raw2.github.com/stri/you/you.4.0.beta/demo/addComment.js

安装成功后，之后，重新启动，便可以使用

	you -r 或 you --run


================= 

## 例二：集成一个打包工具

第一步：得有一个针对自己JS和CSS包的打包工具，比如放在`npm`里，假如这个打包工具叫做A,这个工具可能需要配置一些参数，如有公共包的时候，公共包的路径等

第二步：构建一个集成上一步打包工具A的简单js

		var A = require('A');

		module.exports = function(you){

			// 添加A打包模块
			you.getCombineObject.pack.js['A'] = {
				combine: function(Opts,callback){
					var config = Opts.config; // 筛选自己用的配置参数

					var code = A(config);

					callback(code);

					// 以下是可选，如果配置，则可以使用you默认的`unique_js`功能，来减少同文件夹里的JS在同一页面中应用中的冗余JS代码
					return {
		        	  filePath: 'xx', // 当前路径
		              beCombineMap: {}, // 已合并路径的，格式为beCombineMap[filePath] = 1;
		              fileCodeCache: {} // 已打过包的文件的代码，格式为fileCodeCache[filePath] = code 
					};
				}
			};


			return you;
		}

第三步： 安装，参考上一例子

第四步 通过配置`js_package_depend_style`就可使用了

	you js_package_depend_style A -c
	you -r
	
=========

> 当然，还可以开发一个属于自己的可视化操作界面，存储每个项目的参数，只需简单的切换就可以使用另一种配置参数来使用开发环境。


