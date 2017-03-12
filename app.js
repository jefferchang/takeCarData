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
var request = require('request');
var app = express();
charset(superagent);

app.all('*', function (req, res, next) {
    res.header("Content-Type", "text/html;charset=gb2312");
    next();
});


app.get('/paramSelect', function (req, r) {
    var ser_value = req.query.ser_value;
    var targetUrl = "http://newcar.xcar.com.cn/" + ser_value + "/config.htm";
    superagent.get(targetUrl)
        .charset('gb2312')
        .end(function (err, res) {
            if (res) {
                r.send(res.text);
            }
        });
});

var takedata = [];


app.get('/param', function (req, r) {
    var ser_value = req.query.ser_value;
    var brand_text = req.query.brand_text;
    var brand_value = req.query.brand_value;
    var ser_text = req.query.ser_text;
    var targetUrl = "http://newcar.xcar.com.cn/" + ser_value + "/config.htm";
    takedata.push[targetUrl];
    var buffer = xlsx.build([
        {
            name: '车url',
            data: takedata
        }
    ]);
    fs.writeFileSync('url.xlsx', buffer, {'flag': 'w'});
    superagent.get(targetUrl)
        .charset('gb2312')
        .end(function (err, res) {
            if (res) {
                var htmlall = "";
                var text = res.text;
                var $ = cheerio.load(text, {decodeEntities: false});
                var jq = $(text);
                console.log("进入方法");
                jq.find("#mid option").each(function () { //循环车型
                    var spec_text = $(this).text();
                    var spec_value = $(this).val();
                    if (spec_value != "" && spec_value != '0') {
                        var objd1 = {};
                        objd1.a = [];
                        objd1.b = [];
                        //取大类
                        jq.find(".show_detaile2").each(function () {
                            if ($(this).next().find("[mid=" + spec_value + "]").length > 0) {
                                objd1.a.push($(this).find("b").eq(1).html());
                                objd1.b.push($(this).attr("configid"));
                            }
                        });
                        for (var i = 0; i < objd1.a.length; i++) { //循环大类
                            var Ddlei1_text = objd1.a[i];
                            var Ddlei1_value = objd1.b[i];
                            if (Ddlei1_value != "" && Ddlei1_value != '0') {
                                var objd2 = {};//生成小类
                                objd2.a = [];
                                objd2.b = [];
                                var Ddlei1_val = jq.find("select[name=mid]").val();
                                jq.find("#base_" + Ddlei1_value + " tr").each(function (i) {
                                    if ($(this).find("td[mid=" + Ddlei1_val + "]").length > 0) {
                                        var v = $(this).find('td').eq(0).attr("id").replace('1_', '');
                                        var n = $(this).find('td').eq(0).text().replace('：', '');
                                        objd2.a.push(n);
                                        objd2.b.push(v);
                                    }
                                });
                                for (var k = 0; k < objd2.a.length; k++) {
                                    //循环小类 开始拿值
                                    var Ddlei2_text = objd2.a[k];
                                    var Ddlei2_value = objd2.b[k];
                                    if (Ddlei2_value != "" && Ddlei2_value != '0') {
                                        var m = jq.find("#mid").val();
                                        var thisValue = jq.find("#" + Ddlei2_value + "_" + m).text();//终于拿到值 了。。
                                        var html = brand_text + "=!=" + brand_value + "=!=" +
                                            ser_text + "=!=" + ser_value + "=!=" +
                                            spec_text + "=!=" + spec_value + "=!=" +
                                            Ddlei1_text + "=!=" + Ddlei1_value + "=!=" +
                                            Ddlei2_text + "=!=" + Ddlei2_value + "=!=" + thisValue + "@@##";
                                        htmlall += html;
                                    }
                                }
                            }
                        }
                    }
                });

                var cars = [];
                if (htmlall) {
                    console.log("写入数据");
                    var cardata = htmlall.split("@@##");
                    for (var i = 0; i < cardata.length; i++) {
                        cars.push(cardata[i].split("=!="));
                    }
                    var buffer = xlsx.build([
                        {
                            name: '车参数',
                            data: cars
                        }
                    ]);
                    var bt = brand_text.replace(" ", "-");
                    var st = ser_text.replace(" ", "-");
                    fs.writeFileSync("cardata/" + bt + "_" + st + '.xlsx', buffer, {'flag': 'w'});
                }
                r.send(res.text);
            }
        });
});

//取数据
app.get('/autoParam', function (req, r) {
    var jsstr = "";
    var url = "http://newcar.xcar.com.cn/${url}/config.htm";
    request({
        url: "http://html.xcar.com.cn/newcar/pub_js/car_arr_newcar_2009_ps.js",
        encoding: null
    }, function (error, response, body) {
        jsstr = iconv.decode(body, "gb2312").toString();
        jsstr = jsstr + "  var p = []; p.push(pb_arr);p.push(ps_arr);exports.name=p;";
        fs.writeFile(path.join("js/", 'data.js'), jsstr, function (err) {
            var data = require('./js/data.js');
            var obj =  bsfction(data);//
            var brandname =  obj.brandname;
            var brandvalue = obj.brandvalue;
            var sername = obj.sername;
            var servalue = obj.servalue;
            var i = 0;
            bsloop(brandname,brandvalue,sername,servalue,url,i);
        });
    });
    r.send("正在导入....");
});

//拿到品牌和车系
var bsfction = function (data) {
    var obj =new Object();
    var databs = data.name;
    var pb_arr = databs[0];
    var ps_arr = databs[1];
    var brandstr = pb_arr.split(',');
    var brandname = [];
    var brandvalue = [];
    var sername = [];
    var servalue = [];
    for (var loop = 0; loop < brandstr.length; loop += 2) {
        var bvalue = brandstr[loop];
        var bname = brandstr[loop + 1];
        if (ps_arr[bvalue] != '' && ps_arr[bvalue] != "0") {
            var dd = ps_arr[bvalue].split(',');
            for (var sloop = 0; sloop < dd.length; sloop += 2) {
                brandname.push(bname);
                brandvalue.push(bvalue);
                sername.push(dd[sloop + 1]);
                servalue.push(dd[sloop]);
            }
        }
    }
    obj.brandname=brandname;
    obj.brandvalue=brandvalue;
    obj.sername=sername;
    obj.servalue=servalue;
    return obj;
}
//睡的时间
var sleep  = function (numberMillis) {
    var now = new Date();
    var exitTime = now.getTime() + numberMillis;
    while (true) {
        now = new Date();
        if (now.getTime() > exitTime)
            return;
    }
}
//生成 数据
var chtml = function($,jq,brand_text,brand_value,ser_text,ser_value){
    var htmlall ="";
    jq.find("#mid option").each(function () { //循环车型
        var spec_text = $(this).text();
        var spec_value = $(this).val();
        if (spec_value != "" && spec_value != '0') {
            var objd1 = {};
            objd1.a = [];
            objd1.b = [];
            //取大类
            jq.find(".show_detaile2").each(function () {
                if ($(this).next().find("[mid=" + spec_value + "]").length > 0) {
                    objd1.a.push($(this).find("b").eq(1).html());
                    objd1.b.push($(this).attr("configid"));
                }
            });
            for (var i = 0; i < objd1.a.length; i++) { //循环大类
                var Ddlei1_text = objd1.a[i];
                var Ddlei1_value = objd1.b[i];
                if (Ddlei1_value != "" && Ddlei1_value != '0') {
                    var objd2 = {};//生成小类
                    objd2.a = [];
                    objd2.b = [];
                    var Ddlei1_val = jq.find("select[name=mid]").val();
                    jq.find("#base_" + Ddlei1_value + " tr").each(function (i) {
                        if ($(this).find("td[mid=" + Ddlei1_val + "]").length > 0) {
                            var v = $(this).find('td').eq(0).attr("id").replace('1_', '');
                            var n = $(this).find('td').eq(0).text().replace('：', '');
                            objd2.a.push(n);
                            objd2.b.push(v);
                        }
                    });
                    for (var k = 0; k < objd2.a.length; k++) {
                        //循环小类 开始拿值
                        var Ddlei2_text = objd2.a[k];
                        var Ddlei2_value = objd2.b[k];
                        if (Ddlei2_value != "" && Ddlei2_value != '0') {
                            var m = jq.find("#mid").val();
                            var thisValue = jq.find("#" + Ddlei2_value + "_" + m).text();//终于拿到值 了。。
                            var html = brand_text + "=!=" + brand_value + "=!=" +
                                ser_text + "=!=" + ser_value + "=!=" +
                                spec_text + "=!=" + spec_value + "=!=" +
                                Ddlei1_text + "=!=" + Ddlei1_value + "=!=" +
                                Ddlei2_text + "=!=" + Ddlei2_value + "=!=" + thisValue + "@@##";
                            htmlall += html;
                        }
                    }
                }
            }
        }
    });
    return  htmlall;
}
//生成 excel
var createExcel = function (htmlall,brand_text,ser_text) {
    if (htmlall) {
        var cars = [];
        var cardata = htmlall.split("@@##");
        for (var i = 0; i < cardata.length; i++) {
            cars.push(cardata[i].split("=!="));
        }
        var buffer = xlsx.build([
            {
                name: '车参数',
                data: cars
            }
        ]);
        console.log("准备生成.."+new Date());
        fs.writeFileSync(path.join("cardata/", brand_text + "_" + ser_text + '.xlsx'), buffer, {'flag': 'w'});
        console.log("生成Excel成功"+new Date());
    }
}

var bsloop = function(brandname,brandvalue,sername,servalue,url,i){
        var brand_text= brandname[i];
        var brand_value = brandvalue[i];
        var ser_name =sername[i];
        var ser_value = servalue[i];
        var tagurl = url.replace("${url}",ser_value);
        superagent.get(tagurl).charset('gb2312').end(function (err, res) {
            if (res) {
                var text = res.text;
                var $ = cheerio.load(text, {decodeEntities: false});
                var jq = $(text);
                var htmlall = chtml($,jq,brand_text,brand_value,ser_name,ser_value);
                ///
                createExcel(htmlall,brand_text,ser_name);
            }
            i++;
            if(brandname.length > i ){
                bsloop(brandname,brandvalue,sername,servalue,url,i)
            }else{
                console.log("执行完成功!");
            }
            console.log("执行行数:"+i);
        });


}
app.use(express.static(path.join(__dirname, 'view')));
app.listen(3000);
console.log("启动完成");

 
