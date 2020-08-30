
export class DataAccess {

    constructor() {
        this._datasources=[];
    }

    addSource(data_source) {
        this._datasources.push(data_source);
    }

    getDataSources() {
        return this._datasources;
    }

    getDataSourceByName(name) {
        for(let d of this.getDataSources()) {
            if(d.getName()==name) {
                return d;
            }
        }
        return null;
    }

    getNextFromSet(source_name, column_name, already_used) {
        let col = this.getDataSourceByName(source_name).getColumnByName(column_name);
        for(let val of col.getUniqueValues()) {
            if(!already_used.includes(val)) {
                return val;
            }
        }
        return null;
    }

    add_small_table(sourcename, columns, data) {
        var ds = new SmallTable(sourcename, columns, data);
        ds.setActive(true);
        this.addSource(ds);
        return ds;
    }
}

class Datasource {

    constructor(sourcename) {
        this._active = false;
        this._sourcename = sourcename;
    }

    getName() {
        return this._sourcename;
    }

    setActive(active) {
        this._active = active;
    }
}

class SmallTable extends Datasource {

    constructor(filename, column, data) {
        super(filename);
        this.setData(data, column)

    }

    getWhereKeyIs(key_column_name, key_value, target_column_name) {

        let key_col=this.getColumnByName(key_column_name);
        let target_col=this.getColumnByName(target_column_name);
        let vals=[];
        for(let i=0; i<key_col.getValues().length; i++) {

            if(key_col.getValue(i)== key_value) {
                vals.push(target_col.getValue(i));
            }
        }
        return vals;
    }

    setData(data, columns) {
        this._data = data;
        if (columns != null && typeof (columns[0] == "string")) {
            this._columns = [];
            let i=0;
            for (let col_name of columns) {
                this._columns.push(
                    new DataSourceColumn(col_name, data, i)
                )
                i++;
            }
        } else {
            this._columns = columns;
        }
    }

    getColumns() {
        return this._columns;
    }

    getColumn(i) {
        return this._columns[i];
    }

    getColumnByName(name) {
        for(let col of this._columns) {
            if(col.getName()==name) {
                return col;
            }
        }
        return null;
    }

    numColumns() {
        return this._columns.length;
    }

    setActive(active) {
        super._active = active;
    }

}

class DataSourceColumn {

    constructor(name, dataset, col_num) {
        this._name=name;
        this._dataset=dataset;
        this._col_num=col_num;
        this._values=null;
        this._unique_values=null;
        this._is_full_cardinality=null;

    }

    getName() {
        return this._name;
    }

    getUniqueValues() {
        if(this._unique_values == null) {
            this._unique_values=[...new Set(this._dataset.map(x=> x[this._col_num]))];
        }
        return this._unique_values;
    }

    isFullCardinality() {
        if(this._is_full_cardinality==null) {
            if(this.getUniqueValues().length == this._dataset.length) {
                this._is_full_cardinality = true;
            } else {
                this._is_full_cardinality = false;
            }
        }
        return this._is_full_cardinality;
    }

    getValues() {
        if(this._values==null) {
            this._values=this._dataset.map(x=> x[this._col_num]);
        }
        return this._values;
    }

    getValue(i) {
        return this.getValues()[i];
    }
}

