/**
 * Created by Administrator on 2017/3/14.
 */
var mysql = require('mysql');

var connection =  mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'123456',
    port:'3306',
    database:'test'
});

connection.end(function(err){
    if(err){
        return;
    }
    console.log('[connection end] succeed!');
});

var insert = function(sql,param,callback){
    connection.query(sql,param, function (error,result) {
        if(error){throw error}
        console.log("insert success");
    });
};
var end = function () {
    connection.end(function(err){
        if(err){
            return;
        }
        console.log('[connection end] succeed!');
    });

}
var connectionmysql = function () {
    connection =  mysql.createConnection({
        host:'localhost',
        user:'root',
        password:'123456',
        port:'3306',
        database:'test'
    });
}
exports.connectionmysql = connectionmysql;
exports.insert = insert;
exports.end = end ;
