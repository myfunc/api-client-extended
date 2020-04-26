$(document).ready(main);

function initOptions() {

}

function main() {
	addOption("toBase64", "Enable base64", false);
	$("#send-button").click(sendClick);
}

function getParameters() {
	let headers = {};
	let headerVal = $("#query-headers").val();
	if (headerVal.includes(":")) {
		let headerPairs = headerVal
			.split(";")
			.map(p => p.split(":").map(k=>k.trim()));

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

		if (options.toBase64) {
			let blob = await result.blob();
			let buffer = await blob.arrayBuffer();
			let binArray = new Uint8Array(buffer);
			response = btoa(String.fromCharCode.apply(null, binArray));
		} else {
			response = await result.text();
		}

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

var options = {};

function addOption(code, name, checked) {
	Object.defineProperty(options, code, {
		get() {
			return $(`[data-code='${code}']>input`).prop("checked");
		}
	});
	$("#options-block").append($(`
	<div class="option-row" data-code="${code}">
		<div class="option-name">${name}</div>
		<input type="checkbox" class="option-value" ${checked ? "checked" : ""}>
	</div>
	`));
}