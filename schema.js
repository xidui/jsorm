/**
 * Created by wangyue on 15/11/24.
 */
function Schema(schema){
    function Model(data){
        var d = null;
        try {
            if (typeof(data) == "string")
                d = JSON.parse(data);
            else
                d = JSON.parse(JSON.stringify(data));
            for (var key in d){
                if (!(key in this.schema)) continue;
                this[key] = this.construct(d[key], this.schema[key]);
            }
        } catch (e) {
            console.log(e);
        }
    }

    Model.prototype.construct = function (data, schema){
        if (!data || !schema ) return null;

        if (schema instanceof Array){
            if (!(data instanceof Array)) return null;
            /**
             * data: ['2', '3', '4']
             * schema: [{type: Schema.types.String}]
             */
            ret = [];
            for (var index in data){
                temp = this.construct(data[index], schema[0]);
                if (temp) ret.push(temp);
            }
            return ret;
        }

        if (schema['type']) {
            if (typeof data === schema['type']){
                if (schema['choices']){
                    for (var index in schema['choices']){
                        if (schema['choices'][index] === data)
                            return data;
                    }
                    return schema['default'];
                }
                return data;
            }
            else
                return null;
        }

        var temp, ret;

        /**
         * data: {
         *      a: '1',
         *      b: '2',
         *      c: [{x:1}, {x:2}]
         * }
         * schema: {
         *      a: {type: Schema.types.String},
         *      b: {type: Schema.types.String},
         *      c: [{
         *          x: {type: Schema.types.Number}
         *      }]
         * }
         */
        ret = {};
        for (var key in data){
            if (!(key in schema)) continue;
            temp = this.construct(data[key], schema[key]);
            if (temp) ret[key] = temp;
        }
        return ret;
    };

    Model.prototype.schema = schema;

    Model.prototype.serialize = function (){
        // JSON.stringify 会选择对象的自有变量, 函数和原型链都会被忽略
        return JSON.stringify(this);
    };
    Model.prototype.toJson = function (){
        return JSON.parse(JSON.stringify(this));
    };
    Model.prototype.validate = function (){
        // 目前validate支持type, required关键词
        // 暂时还不支持嵌套
        var obj = this.toJson();
        var _validate = function (obj, schema){
            var flag = true;
            if (schema instanceof Array){
                /**
                 * data: ['2', '3', '4']
                 * schema: [{type: Schema.types.String}]
                 */
                if (!(obj instanceof Array)){
                    console.log(obj + ' not instanceof Array');
                    return false;
                }

                for (var index in obj){
                    flag = _validate(obj[obj], schema[0]);
                    if (!flag) return flag
                }
                return flag;
            }

            if (schema['type'] ){
                if (!obj && schema['required']){
                    console.log('key missing');
                    return false;
                }
                if (typeof obj === schema['type'])
                    return true;
                else {
                    console.log(obj + ' does not match type <' + schema['type'] + '>');
                    return false;
                }
            }

            for (var key in schema){
                flag = _validate(obj[key], schema[key]);
                if (!flag){
                    return false;
                }
            }
            return flag;
        };
        return _validate(obj, this.schema);
    };
    Model.un_serialize = function (data){
        return new this(data);
    };
    return Model;
}

Schema.types = {
    String: 'string',
    Number: 'number',
    Boolean: 'boolean'
};

module.exports = Schema;