$(document).ready(main);

function main() {
	selectAllHandle("#data-content");
	addOption("toBase64", "Parse response to base64", false);
	addOption("toMsgPack", "Parse response as msgpack", false);
	addOption("isPrettyMsgPack", "Format msgpack", false);
	memorizeState("[data-memorize]");
	$("#send-button").click(sendClick);
}

function selectAllHandle(selector) {
	let elems = $(selector);
	elems.click(p=>p.target.focus());
	elems.on("keydown", (event) => {
		if (event.ctrlKey == true 
			&& (event.keyCode == 65 || event.keyCode == 97)) {
			let elem = event.target;
			var range = document.createRange();
	        range.selectNode(elem);
	        window.getSelection().removeAllRanges();
	        window.getSelection().addRange(range);
	        event.preventDefault();
		}
	});
}

function memorizeState(selector) {
	var inputs = $(selector);
	var inputElems = inputs.get();
	for (let elem of inputElems) {
		var storedValue = localStorage.getItem(elem.id);
		if (storedValue !== null) {
			setElemValue(elem, storedValue);
		}
	}

	setTimeout(()=>inputs.change(saveState), 5);
}

function saveState(e) {
	let elem = e.target;
	localStorage.setItem(elem.id, getElemValue(elem));
}

function getParameters() {
	let headers = {};
	let headerVal = $("#query-headers").val();
	if (headerVal.includes(":")) {
		let headerPairs = headerVal
			.split(";")
			.map(p => p.split(":").map(k=>k.trim()))
			.filter(p => p.length == 2);

		for (let pair of headerPairs) {
			headers[pair[0]] = pair[1];
		}
	}
	
	let parameters = {
		url: $("#query-url").val(),
		options: {
			method: $("#query-method").val(),
		}
	};

	if (headers) {
		parameters.options.headers = headers;
	}

	if (parameters.options.method.toUpperCase() != "GET") {
		parameters.options.body = $("#query-body").val();
	}

	return parameters;
}

async function sendClick() {
	try {
		let params = getParameters();
		let result = await fetch(params.url, params.options);

		if (!result.status.toString().match(/2\d\d/)) {
			setError(`Result: ${result.status} ${result.statusText}`);
			return;
		}

		let response;
		if (options.toMsgPack) {
			let blob = await result.blob();
			let buffer = await blob.arrayBuffer();
			let binArray = new Uint8Array(buffer);
			let resultArray = JSON.stringify(msgpack.deserialize(binArray));
			if (options.isPrettyMsgPack) {
				resultArray = prettyArray(resultArray);
			}
			response = resultArray;
		} else if (options.toBase64) {
			let blob = await result.blob();
			let buffer = await blob.arrayBuffer();
			let binArray = new Uint8Array(buffer);
			response = btoa(String.fromCharCode.apply(null, binArray));
		} else {
			response = await result.text();
		}
		clearError();
		$("#data-content").text(response);
	} catch (e) {
		setError(e.message);
		throw e;
	}
}

function setError(text) {
	$(".error-sign").removeAttr("hidden");
	$(".response-content-wrapper").addClass("response-error");
	$("#data-content").text(text);
}

function clearError() {
	$(".error-sign").attr("hidden", "");
	$("response-content-wrapper").removeClass("response-error");
	$("#data-content").text("");
}

function getElemValue(elem) {
	if (elem.type == "checkbox") {
		return elem.checked;
	} 
	return elem.value;
}

function setElemValue(elem, value) {
	if (elem.type == "checkbox") {
		elem.checked = value === "true";
	} 
	elem.value = value;
}

var options = {};

function addOption(code, name, checked) {
	Object.defineProperty(options, code, {
		get() {
			return $(`#option-${code}`).prop("checked");
		}
	});
	$("#options-block").append($(`
	<div class="option-row">
		<div class="option-name">${name}</div>
		<input data-memorize id="option-${code}" type="checkbox" class="option-value" ${checked ? "checked" : ""}>
	</div>
	`));
}

function prettyArray(arrayStr) {
	let options = {
	    brace_style: "collapse",
	    break_chained_methods: false,
	    comma_first: false,
	    e4x: false,
	    end_with_newline: false,
	    indent_char: " ",
	    indent_empty_lines: false,
	    indent_inner_html: false,
	    indent_scripts: "normal",
	    indent_size: "4",
	    jslint_happy: false,
	    keep_array_indentation: false,
	    max_preserve_newlines: "5",
	    preserve_newlines: true,
	    space_before_conditional: true,
	    unescape_strings: false,
	    wrap_line_length: "0"
	}
	return js_beautify(arrayStr, options);
}