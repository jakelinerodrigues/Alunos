//1. Inicialização

var localDB = null;

function onInit(){
    try {
        if (!window.openDatabase) {
            updateStatus("Erro: Seu navegador não permite banco de dados.");
        }
        else {
            initDB();
            createTables();
            queryAndUpdateOverview();
        }
    } 
    catch (e) {
        if (e == 2) {
            updateStatus("Erro: Versão de banco de dados inválida.");
        }
        else {
            updateStatus("Erro: Erro desconhecido: " + e + ".");
        }
        return;
    }
}

function initDB(){
    var shortName = 'tabela';
    var version = '1.0';
    var displayName = 'TabelaDB';
    var maxSize = 65536; // Em bytes
    localDB = window.openDatabase(shortName, version, displayName, maxSize);
}

function createTables(){
    var query = 'CREATE TABLE IF NOT EXISTS alunos(id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, nome VARCHAR NOT NULL, curso VARCHAR NOT NULL)';
    try {
        localDB.transaction(function(transaction){
            transaction.executeSql(query, [], nullDataHandler, errorHandler);
            updateStatus("Tabela 'alunos' status: OK.");
        });
    } 
    catch (e) {
        updateStatus("Erro: Data base 'alunos' não criada " + e + ".");
        return;
    }
}




//2. Query e visualização de Update
function onSalvar(){
	var id = document.itemForm.id.value;
	if(id==''){
		onCreate();
	}else{
		onUpdate();
	}
	
}

function onUpdate(){
    var id = document.itemForm.id.value;
    var nome = document.itemForm.nome.value;
    var curso = document.itemForm.curso.value;
        if (nome == "" || curso == "") {
        updateStatus("Nome e curso são campos obrigatórios!");
    }
    else {
        var query = "update alunos set nome=?, curso=? where id=?;";
        try {
            localDB.transaction(function(transaction){
                transaction.executeSql(query, [nome, curso,  id], function(transaction, results){
                    if (!results.rowsAffected) {
                        updateStatus("Erro: Update não realizado.");
                    }
                    else {
                        updateForm("", "", "");
                        updateStatus("Update realizado:" + results.rowsAffected);
                        queryAndUpdateOverview();
                        $.mobile.changePage("#lista", { transition: "slide",reverse :"true"} );
                    }
                }, errorHandler);
            });
        } 
        catch (e) {
            updateStatus("Erro: UPDATE não realizado " + e + ".");
        }
    }
}

function onDelete(){
    var id = document.itemForm.id.value;
    
    var query = "delete from alunos where id=?;";
    try {
        localDB.transaction(function(transaction){
        
            transaction.executeSql(query, [id], function(transaction, results){
                if (!results.rowsAffected) {
                    updateStatus("Erro: Delete não realizado.");
                }
                else {
                    updateForm("", "", "");
                    updateStatus("Linhas deletadas:" + results.rowsAffected);
                    queryAndUpdateOverview();
					$.mobile.changePage("#lista", { transition: "fade",reverse :"true"} );
                }
            }, errorHandler);
        });
    } 
    catch (e) {
        updateStatus("Erro: DELETE não realizado " + e + ".");
    }
    
}

function onCreate(){
    var nome = document.itemForm.nome.value;
    var curso = document.itemForm.curso.value;
    if (nome == "" || curso == "" ) {
        updateStatus("Nome ecurso  são campos obrigatórios!");
    }
    else {
        var query = "insert into alunos (nome, curso) VALUES (?, ?);";
        try {
            localDB.transaction(function(transaction){
                transaction.executeSql(query, [nome, curso], function(transaction, results){
                    if (!results.rowsAffected) {
                        updateStatus("Erro: Inserção não realizada");
                    }
                    else {
                        updateForm("", "", "", "");
                        updateStatus("Inserção realizada, linha id: " + results.insertId);
                        queryAndUpdateOverview();
                        $.mobile.changePage("#lista", { transition: "fade",reverse :"true"} );
                    }
                }, errorHandler);
            });
        } 
        catch (e) {
            updateStatus("Erro: INSERT não realizado " + e + ".");
        }
    }
}

function onSelect(htmlLIElement){
	var id = htmlLIElement.getAttribute("id");
	
	query = "SELECT * FROM alunos where id=?;";
    try {
        localDB.transaction(function(transaction){
        
            transaction.executeSql(query, [id], function(transaction, results){
            
                var row = results.rows.item(0);
                
                updateForm(row['id'], row['nome'], row['curso']);
				$.mobile.changePage("#novo", { transition: "fade"} );
                
            }, function(transaction, error){
                updateStatus("Erro: " + error.code + "<br>Mensagem: " + error.message);
            });
        });
    } 
    catch (e) {
        updateStatus("Error: SELECT não realizado " + e + ".");
    }
   
}

function queryAndUpdateOverview(){

	//Remove as linhas existentes para inserção das novas
    var dataRows = document.getElementById("itemData").getElementsByClassName("data");
	
    while (dataRows.length > 0) {
        row = dataRows[0];
        document.getElementById("itemData").removeChild(row);
    };
    
	//Realiza a leitura no banco e cria novas linhas na tabela.
    var query = "SELECT * FROM alunos ORDER BY nome ASC;";
    try {
        localDB.transaction(function(transaction){
        
            transaction.executeSql(query, [], function(transaction, results){
                for (var i = 0; i < results.rows.length; i++) {
                
                    var row = results.rows.item(i);
					var a = document.createElement("a");
					a.setAttribute('href','#')
                    var li = document.createElement("li");
					li.setAttribute("id", row['id']);
                    li.setAttribute("class", "data");
                    li.setAttribute("onclick", "onSelect(this)");
                    
                    var liText = document.createTextNode(row['nome'] + " : "+ row['curso'] + "/");
					a.appendChild(liText);
                    li.appendChild(a);
                    
                    document.getElementById("itemData").appendChild(li);
					$('#itemData').listview('refresh');
                }
            }, function(transaction, error){
                updateStatus("Erro: " + error.code + "<br>Mensagem: " + error.message);
            });
        });
    } 
    catch (e) {
        updateStatus("Error: SELECT não realizado " + e + ".");
    }
}

// 3. Funções de tratamento e status.

// Tratando erros

errorHandler = function(transaction, error){
    updateStatus("Erro: " + error.message);
    return true;
}

nullDataHandler = function(transaction, results){
}

// Funções de update

function updateForm(id, nome, curso){
    document.itemForm.id.value = id;
    document.itemForm.nome.value = nome;
    document.itemForm.curso.value = curso;
}

function updateStatus(status){
    $('.status').html(status);
}