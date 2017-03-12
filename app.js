var express = require('express');
var http = require("http");
var path = require("path");
var koa = require('koa');
var router = require('koa-router');
var url = require('url');
var superagent = require('superagent');
var charset = require('superagent-charset');
var cheerio = require('cheerio');
var eventproxy = require('eventproxy');
var BufferHelper = require('bufferhelper');
var iconv = require('iconv-lite');
var xlsx = require('node-xlsx');
var fs = require('fs');
var app = express();
charset(superagent);

app.all('*', function(req, res, next) {
    res.header("Content-Type", "text/html;charset=gb2312");
    next();
});

var takedata  = [];

app.get('/param', function (req, r) {
    var  ser_value =  req.query.ser_value;
    var  brand_text =  req.query.brand_text;
    var  brand_value =  req.query.brand_value;
    var  ser_text =  req.query.ser_text;
    var targetUrl ="http://newcar.xcar.com.cn/"+ser_value+"/config.htm";
    takedata.push[targetUrl];
    var buffer = xlsx.build([
        {
            name:'车url',
            data:takedata
        }
    ]);
    fs.writeFileSync('url.xlsx',buffer,{'flag':'w'});
    superagent.get(targetUrl)
        .charset('gb2312')
        .end(function (err, res) {
            if(res){
                var htmlall="";
                var text=res.text;
                var $ = cheerio.load(text,{decodeEntities: false});
                var jq = $(text);
                console.log("进入方法");
                jq.find("#mid option").each(function () { //循环车型
                    var spec_text = $(this).text();
                    var spec_value = $(this).val();
                    if(spec_value!="" && spec_value !='0'){
                        var objd1 ={};
                        objd1.a=[];
                        objd1.b=[];
                        //取大类
                        jq.find(".show_detaile2").each(function(){
                            if($(this).next().find("[mid=" + spec_value + "]").length > 0){
                                objd1.a.push($(this).find("b").eq(1).html());
                                objd1.b.push($(this).attr("configid"));
                            }
                        });
                        for(var i =0;i<objd1.a.length;i++){ //循环大类
                            var Ddlei1_text = objd1.a[i];
                            var Ddlei1_value = objd1.b[i];
                            if(Ddlei1_value!="" && Ddlei1_value!='0'){
                                var objd2 = {};//生成小类
                                objd2.a=[];
                                objd2.b=[];
                                var Ddlei1_val =jq.find("select[name=mid]").val();
                                jq.find("#base_"+Ddlei1_value+" tr").each(function(i){
                                    if($(this).find("td[mid=" + Ddlei1_val + "]").length > 0){
                                        var v = $(this).find('td').eq(0).attr("id").replace('1_','');
                                        var n = $(this).find('td').eq(0).text().replace('：','');
                                        objd2.a.push(n);
                                        objd2.b.push(v);
                                    }
                                });
                                for(var k =0;k<objd2.a.length;k++){
                                    //循环小类 开始拿值
                                    var Ddlei2_text = objd2.a[k];
                                    var Ddlei2_value = objd2.b[k];
                                    if(Ddlei2_value!="" && Ddlei2_value!='0'){
                                        var m = jq.find("#mid").val();
                                        var thisValue = jq.find("#"+Ddlei2_value+"_"+m).text();//终于拿到值 了。。
                                        var html = brand_text+"=!="+brand_value+"=!="+
                                            ser_text+"=!="+ser_value+"=!="+
                                            spec_text+"=!="+spec_value+"=!="+
                                            Ddlei1_text+"=!="+Ddlei1_value+"=!="+
                                            Ddlei2_text+"=!="+Ddlei2_value+"=!="+ thisValue +"@@##";
                                        htmlall+= html;
                                    }
                                }
                            }
                        }
                    }
                });

                var cars=[];
                if(htmlall){
                    console.log("写入数据");
                   var  cardata = htmlall.split("@@##");
                    for(var i=0;i<cardata.length;i++){
                        cars.push(cardata[i].split("=!="));
                    }
                    var buffer = xlsx.build([
                        {
                            name:'车参数',
                            data:cars
                        }
                    ]);
                    fs.writeFileSync("cardata/"+brand_text+"_"+ser_text+'.xlsx',buffer,{'flag':'w'});
                }
                r.send(text);
            }
        });
});


//取数据
app.get('/cardata', function (req, r) {
    var cardata =  req.query.cardata;
    console.log(cardata);
    var cars=[234];
    if(cardata){
        for(var i=0;i<cardata.length;i++){
              cars.push(cardata[i].split(":"));
        }
        var buffer = xlsx.build([
            {
                name:'车参数',
                data:cars
            }
        ]);
        fs.writeFileSync('test.xlsx',buffer,{'flag':'w'});
    }
});

app.use(express.static(path.join(__dirname, 'view')));
app.listen(3000);
console.log("启动完成");

 
