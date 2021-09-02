const socket = io();

var gameConfig = null;
var activeGame = null;
var ready = false;
var myUUID = null;

var selectedCards = [];

socket.on("message", function (message, content) {
	console.debug(message);
	console.debug(content);

	switch (message) {
		case "message":
			handleMessage(content);
			break;

		case "state":
			handleGameState(content);
			break;

		case "game_list":
			handleGameList(content);
			break;


		case "client_settings":
			gameConfig = content;
			myUUID = gameConfig.uuid;
			ready = true;
			setupExpansions();
			break;


		default:
			console.warn("invalid packet: " + message);
			break;
	}
});

function getDeck(name) {
	let result = null;

	gameConfig.deckCollections.forEach((deckCollection) => {
		deckCollection.decks.forEach((deck) => {
			if (deck.name == name) {
				result = deck;
			}
		});
	});

	return result;
}

function joinGame(uuid) {
	socket.send("join_game", {
		uuid: uuid
	});
}

function handleGameList(data) {
	if (!ready) {
		console.log("ignoring handleGameList() since we are not ready");
		return;
	}


	/* ===== Setup table rows ===== */
	let foundGames = [];

	$(".game-tr").each(function () {
		let uuid = $(this).data("game-id");

		foundGames.push(uuid);
	});

	//console.log(foundGames);

	for (let i = 0; i < data.games.length; i++) {
		let game = data.games[i];

		//console.log("foundGames.includes(game.uuid) " + game.uuid + " : " + foundGames.includes(game.uuid));

		if (foundGames.includes(game.uuid)) {
			foundGames.remove(game.uuid);
		} else {
			console.debug("Creating tr for game " + game.uuid);

			let newElement = $("#game_tr_template").clone();
			newElement.removeAttr("id");
			newElement.addClass("game-tr");
			newElement.attr("data-game-id", game.uuid);

			newElement.find(".td-game-name").text(game.name);

			newElement.find(".join-game-button").on("click", function () {
				let uuid = $(this).parent().parent().data("game-id");
				console.debug("Attempting to join game " + uuid);
				joinGame(uuid);
			});

			console.log(newElement);

			$("#game_table_rows").prepend(newElement);
		}
	}

	$(".game-tr").each(function () {
		let uuid = $(this).data("game-id");

		if (foundGames.includes(uuid)) {
			$(this).remove();
		}
	});

	/* ===== Update rows ===== */
	for (let i = 0; i < data.games.length; i++) {
		let game = data.games[i];

		$(".game-tr").each(function () {
			let uuid = $(this).data("game-id");

			if (game.uuid == uuid) {
				$(this).find(".td-game-player-count").text(game.player_count + " / " + gameConfig.maxPlayersPerGame + " Players")

				let expansions = "";

				game.decks.forEach((deckName) => {
					let deck = getDeck(deckName);

					if (deck == null) {
						expansions += "null, ";
					} else {
						expansions += deck.displayName + ", ";
					}
				});

				if (expansions.length > 2) {
					expansions = expansions.substring(0, expansions.length - 2)
				}

				$(this).find(".td-game-expansions").text(expansions)
			}
		});
	}
}

function handleGameState(data) {
	if (!ready) {
		console.log("ignoring handleGameState() since we are not ready");
		return;
	}


	if (data.active_game == null) {
		$("#game_browser").show();
		$("#game").hide();

		activeGame = null;
	} else {
		$("#game").show();
		$("#game_browser").hide();

		activeGame = data.active_game;

		if (activeGame.state == 0) {
			/* ===== Lobby data ===== */
			$("#waiting_lobby").show();
			$("#in_game").hide();

			if (activeGame.host == myUUID) {
				$("#host_options").show();
			} else {
				$("#host_options").hide();
			}

			$("#players_tbody").find(".lobby-player-tr").remove();
			for (let i = 0; i < activeGame.players.length; i++) {
				let player = activeGame.players[i];

				let newElement = $("#lobby_player_template").clone();
				newElement.removeAttr("id");
				newElement.addClass("lobby-player-tr");
				newElement.attr("data-player-id", player.uuid);

				newElement.find(".td-player-name").text(player.username);

				$("#players_tbody").append(newElement);
			}

			let expansions = "";

			activeGame.decks.forEach((deckName) => {
				let deck = getDeck(deckName);

				if (deck == null) {
					expansions += "null, ";
				} else {
					expansions += deck.displayName + ", ";
				}
			});

			if (expansions.length > 2) {
				expansions = expansions.substring(0, expansions.length - 2)
			}

			$("#game_expansions").text(expansions);
		} else {
			/* ===== In game ===== */
			$("#waiting_lobby").hide();
			$("#in_game").show();

			if (activeGame.black_card != null) {
				let blackCard = activeGame.black_card;

				$("#black_card_pick").text("pick " + blackCard.pick);
				$("#black_card_text").html(blackCard.text);
			} else {
				$("#black_card_pick").text("");
				$("#black_card_text").text("");
			}



			let handCards = [];

			$(".player-hand-card").each(function () {
				handCards.push(b64_to_utf8($(this).data("content")));
			});

			console.log(handCards);

			activeGame.hand.forEach((card) => {
				if (!handCards.includes(card)) {
					let newHtml = $("#white_card_template").clone();

					newHtml.removeAttr("id");
					newHtml.attr("data-content", utf8_to_b64(card));
					newHtml.addClass("player-hand-card");

					newHtml.find(".selected-card-number").hide();
					newHtml.find(".cord-text-content").html(card);

					newHtml.on("click", function () {
						if ($(this).hasClass("selected-white-card")) {
							$(this).removeClass("selected-white-card");
							selectedCards.remove(b64_to_utf8($(this).data("content")));
							updateSelectionNumbers();
						} else {
							if (activeGame.black_card == null) {
								return;
							}

							if (selectedCards.length >= activeGame.black_card.pick) {
								toastr.warning("Click on the selected cards to unselect them", "You have selected the maximum amount of cards");
								return;
							}

							$(this).addClass("selected-white-card");
							selectedCards.push(b64_to_utf8($(this).data("content")));
							updateSelectionNumbers();
						}


					});

					$("#player_hand").append(newHtml);
				}

				handCards.remove(card);
			});


			$(".player-hand-card").each(function () {
				if (handCards.includes(b64_to_utf8($(this).data("content")))) {
					$(this).remove();
				}
			});
		}
	}
}

function updateSelectionNumbers() {
	if(activeGame != null) {
		if(activeGame.black_card != null) {
			let select = activeGame.black_card.pick;

			$("#player_hand").find(".selected-card-number").hide();
			if(select > 1) {
				for(let i = 0; i < selectedCards.length; i++) {
					let b64 = utf8_to_b64(selectedCards[i]);
					console.log("target: " + b64);
					$("#player_hand").find(".player-hand-card").each(function() {
						console.log($(this).data("content"));
						if($(this).data("content") == b64) {
							$(this).find(".selected-card-number").text(i + 1);
							$(this).find(".selected-card-number").show();
						}
					});
				}
			}
		}
	}
}

$(function () {
	$("#game").hide();

	$("#btn_createGame").on("click", function () {
		let gameName = $("#tbx_careateGameName").val();

		if (gameName.length == 0) {
			toastr.error("Please provide a name for the game");
			return;
		}

		if (gameName.length > gameConfig.maxGameNameLength) {
			toastr.error("The name cant be over " + gameConfig.maxGameNameLength + " characters");
			return;
		}

		socket.send("create_game", {
			game_name: gameName
		});
	});

	$(".btn_leaveGame").on("click", function () {
		socket.send("leave_game", {});
	});

	$("#btn_select_expansions").on("click", function () {
		updateExpansionSelector();
		$("#selectExpansionsModal").modal("show");
	});

	$("#btn_save_expansions").on("click", function () {
		$("#selectExpansionsModal").modal("hide");
		saveExpansions();
	});

	$("#btn_start_game").on("click", function () {
		socket.send("start_game", {});
	})
});

function useAllExpansions() {
	$(".cbx-expansion-selection").prop("checked", true);
}

function setupExpansions() {
	$("#expansions").text("");
	gameConfig.deckCollections.forEach((deckCollection) => {
		console.log(deckCollection);

		let collectionHtml = $("#deck_collection_template").clone();
		collectionHtml.removeAttr("id");
		collectionHtml.find(".collection-name").text(deckCollection.displayName);
		collectionHtml.find(".collection-description").html(deckCollection.description);
		$("#expansions").append(collectionHtml);

		deckCollection.decks.forEach((deck) => {
			let deckId = "cbx_deck-" + deck.name;

			let title = deck.blackCards.length + " black cards " + deck.whiteCards.length + " white cards";

			let newElement = $("#expanstion_template").clone();
			newElement.removeAttr("id");
			newElement.attr("title", title);
			newElement.find(".form-check-input").attr("id", deckId);
			newElement.find(".form-check-input").addClass("cbx-expansion-selection");
			newElement.find(".form-check-input").attr("data-deck-name", deck.name);
			newElement.find(".form-check-label").attr("for", deckId);
			newElement.find(".form-check-label").text(deck.displayName);

			$("#expansions").append(newElement);
		});
	});
}

function updateExpansionSelector() {
	if (activeGame == null) {
		$(".cbx-expansion-selection").prop("checked", false);
	} else {
		activeGame.decks.forEach((deck) => {
			$(".cbx-expansion-selection[data-deck-name=\"" + deck + "\"]").prop("checked", true);
		})
	}
}

function saveExpansions() {
	let expansions = {};

	$(".cbx-expansion-selection").each(function () {
		let name = $(this).data("deck-name");

		expansions[name] = $(this).is(':checked');
	});

	console.debug(expansions);

	socket.send("set_game_expanstions", {
		expansions: expansions
	});
}