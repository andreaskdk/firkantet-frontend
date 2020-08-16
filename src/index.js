import {DataAccess} from "./DataAccess.js"

import d3 from "d3/dist/d3"

export const version = "0.0.4";

var data_access = null;
var headers = [];
var cells = [];
var key_relation = null;



class Column {
    constructor(name) {
        this._name = name;
        this._editable = true;
    }

    getName() {
        return this._name;
    }

    getType() {
        return this.constructor.name;
    }
}

class CtCColumn extends Column {

    constructor(data_source, column, operator, key_full_cardinality, one_to_one) {
        super(column.getName());
        this._column=column;
        this._data_source=data_source;
        this._operator=operator;
        this._key_full_cardinality=key_full_cardinality;
        this._one_to_one=one_to_one;
    }

    getKeyFullCardinality() {
        return this._key_full_cardinality;
    }

    getOperator() {
        return this._operator;
    }

    getOneToOne() {
        return this._one_to_one;
    }

    getColumnName() {
        return this._column.getName();
    }

    getDataSource() {
        return this._data_source;
    }
}

class KeyRelation {
    constructor() {
    }

    getType() {
        return this.constructor.name;
    }
}

class NotFoundKeyRelation extends KeyRelation {
    constructor() {
        super();
    }
}

class ColumnSetRelation extends KeyRelation {
    constructor(data_source, column) {
        super();
        this._data_source=data_source;
        this._column=column;
    }

    getDataSource() {
        return this._data_source;
    }

    getColumn() {
        return this._column;
    }

    getSourceName() {
        return this._data_source.getName();
    }

    getColumnName() {
        return this._column.getName();
    }
}


export function create_datasources_panel() {

    d3.select("#uploadInput").on("change", (d, i, nodes) => {

        if (nodes[0].files.length == 0) {
            throw "No file uploaded";
        }

        let file = nodes[0].files[0];
        var ds = new SmallTable(file.name, null, null);

        data_access.addSource(ds);
        update_source_list_panel();

        file.text().then(file_text => {
            var csv_data = d3.csvParse(file_text);
            var data = []
            for (let d of csv_data) {
                var row = [];
                for (let col_name of csv_data.columns) {
                    row.push(d[col_name]);
                }
                data.push(row);
            }
            ds.setData(data, csv_data.columns)
            update_source_list_panel();
        });

    }, false);
}


function update_source_list_panel() {

    d3.select("#datasources").node().innerHTML = "";
    d3.select("#datasources").selectAll(".datasource_div")
        .data(datasources)
        .enter()
        .append("div")
        .attr("class", "datasource_div")
        .text(d => d._sourcename);

}

export function create_main_table_panel() {
    key_relation = new NotFoundKeyRelation();
    data_access = new DataAccess();
    cells = [];
    headers = [new Column("Key")];
    cells = [];

    draw_main_table_panel();
}

function draw_main_table_panel() {

    d3.select("#maintablepanel").node().innerHTML = "";

    const main_table_panel = d3.select("#maintablepanel");
    main_table_panel.append("div").attr("id", "key_relation_div").text("Key relation");
    main_table_panel.append("div").attr("id", "constraint_div").text("Constraint");
    main_table_panel.append("div").attr("id", "sort_order_div").text("Sort order");

    var table = main_table_panel.append("div").attr("id", "main_data_table").append("table");

    table.append("thead").append("tr")
        .selectAll(".table_header")
        .data(headers)
        .enter()
        .append("th")
        .attr("class", "table_header")
        .text(d => d.getName());

    const table_rows = table.selectAll(".data_row")
        .data(cells);


    table_rows
        .enter()
        .append("tr")
        .attr("class", "data_row")
        .selectAll(".data_cell")
        .data(d => d)
        .enter()
        .append("td")
        .attr("class", "data_cell")
        .attr("contenteditable", "true")
        .on("blur", (d, i, l) => {
            if (d.text != l[i].textContent) {
                d.text = l[i].textContent;
                d.user_entered = true;
            }
        })
        .text(d => d.text);


}


function find_theme() {
    // options are column sets, restricted column sets

    var user_entered_key_cells = cells.map(x => x[0]).filter(x => x.user_entered).map(x => x.text);
    var best_score = -1.0;
    var best_theme = null;

    for (let data_source of data_access.getDataSources()) {
        for (let i = 0; i < data_source.numColumns(); i++) {
            var score = 0.0;
            user_entered_key_cells.forEach(x => score += data_source.getColumn(i).getUniqueValues().includes(x) ? 1 : 0);
            if (score > best_score) {
                best_score = score;
                best_theme = new ColumnSetRelation(data_source, data_source.getColumn(i));
            }
        }
    }
    key_relation=best_theme;
    return best_theme;
}


export function set_initial_data(key_data) {
    headers = [new Column("Key")];
    key_relation = new NotFoundKeyRelation();
    cells = key_data.map(x => [{ text: x, user_entered: true }]);

    draw_main_table_panel();
}

function next_row() {
    let next_key=null;
    if(key_relation.getType() == "ColumnSetRelation") {
        let already_used = cells.map(row => row[0].text);
        next_key = data_access.getNextFromSet(key_relation.getSourceName(), key_relation.getColumnName(), already_used);
    }
    if(next_key == null) {
        return null;
    } else {
        // TODO: This only works for CtCColumns
        return [ {text: next_key, user_entered: false}].concat(
            headers.slice(1).
            map(x=> ({
                text: key_relation.getDataSource().getWhereKeyIs(key_relation.getColumnName(), next_key, x.getColumnName()), 
                user_entered: false})));
    }
}

function score_column_relation(rel) {
    let score=0;
    if(rel.getType() == "CtCColumn") {
        if(rel.getOneToOne()) {
            score+=2;
        }
        if(rel.getKeyFullCardinality()) {
            score-=1;
        }
    }
    return score;
}

function best_next_column_relation() {

    var best_score=-1.0;
    var best_column_relation=null;
    
    if(key_relation.getType() == "ColumnSetRelation") {
        let ds=data_access.getDataSourceByName(key_relation.getSourceName());
        let key_column = ds.getColumnByName(key_relation.getColumnName());
        let key_full_cardinality=ds.getColumnByName(key_relation.getColumnName()).isFullCardinality();
        for(let col of ds.getColumns()) {
            let used_already = col.getName() == key_relation.getColumnName() 
                || headers.filter(x=>x.getType() == "CtCColumn" && x.getDataSource() == key_relation.getDataSource())
                    .map(x=>x.getColumnName()).includes(col.getName());
            if(!used_already) {
                let onetoone = true;
                if(!key_full_cardinality) {
                    let onetoonemap = {};
                    for (let i = 0; i < ds.length; i++) {
                        if (key_column.getValue(j).toString() in onetoonemap) {
                            if (col.getValue(j) != onetoonemap[key_column.getValue(j).toString()]) {
                                onetoone = false;
                                break;
                            }
                        }
                        onetoonemap[key_column.getValue(j).toString()] = col.getValue(j);
                    }
                }

                for(let operator in ["random"]) {
                    let candidate_relation = new CtCColumn(ds, col, operator, key_full_cardinality, onetoone);
                    let score=score_column_relation(candidate_relation);
                    if(score>best_score) {
                        best_score=score;
                        best_column_relation=candidate_relation;
                    }
                }
            }

        }
    }

    return best_column_relation;
}

export function expand_right() {
    let col_relation=best_next_column_relation();
    if(col_relation!=null) {
        headers.push(col_relation);
        for(let i=0; i<cells.length; i++) {
            let value_set=col_relation.getDataSource().getWhereKeyIs(key_relation.getColumnName(), cells[i][0].text, col_relation.getColumnName());
            cells[i].push({text: value_set[0]});
        }
        draw_main_table_panel();
    }
}

export function expand_down() {
    if(key_relation.getType()=="NotFoundKeyRelation") {
        find_theme();
    }
    let row = next_row();
    
    cells.push(row);
    draw_main_table_panel();
}


function getDataAccess() {
    return data_access;
}

function getKeyRelation() {
    return key_relation;
}

export function getD3Version() {
    return d3.version;
}

export function add_small_table(sourcename, columns, data) {
    data_access.add_small_table(sourcename, columns, data);
    update_source_list_panel();
}

/*
exports.getD3Version = getD3Version;
exports.version = version;
exports.create_datasources_panel = create_datasources_panel;
exports.create_main_table_panel = create_main_table_panel;
exports.add_small_table = add_small_table;
exports.set_initial_data = set_initial_data;
exports.expand_down = expand_down;
exports.expand_right = expand_right;


exports.getDataAccess = getDataAccess;
exports.getKeyRelation = getKeyRelation;

Object.defineProperty(exports, '__esModule', { value: true });
*/
