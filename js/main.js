/**
 * Допоміжні функції
 */
function setValueForSelect(select, value) {
	let optionExists = false
	for (let i = 0; i < select.options.length; i++) {
		if (select.options[i].value == value) {
			optionExists = true
			break
		}
	}
	if (optionExists) select.value = value
}

function setValueForNumericInput(input, value) {
	value = Number(value)
	if (!isNaN(value) && value >= input.min && value <= input.max) input.value = value
}

/**
 * 
 */
const 	inp_country 	= document.getElementById('select-cou'),
		inp_tournament 	= document.getElementById('select-tou'),
		inp_status 		= document.getElementById('select-status'),
		inp_season_min	= document.getElementById('input-season-min'),
		inp_season_max	= document.getElementById('input-season-max'),
		btn_filter_erase	= document.getElementById('btn-filter-erase'),
		form_filter		= document.getElementById('form-filter'),
		inp_sport		= document.getElementById('select-sport'),
		inp_sport_vis	= document.getElementById('select-sport-visible'),
		form_sport		= document.getElementById('form-sport'),
		navbar			= document.querySelector('.navbar'),
		tbody_titles	= document.querySelector('#table-titles tbody'),
		main			= document.querySelector('main'),
		tbody_history	= document.querySelector('#table-history tbody')

let countries, winnercountries, teams, winners, positions, season_max, sportcolor

const urlParams = new URLSearchParams(window.location.search)
setValueForSelect(inp_country, urlParams.get('cou')??30)
setValueForSelect(inp_tournament, urlParams.get('tou'))
setValueForSelect(inp_status, urlParams.get('status'))
setValueForNumericInput(inp_season_min, urlParams.get('smin'))
setValueForNumericInput(inp_season_max, urlParams.get('smax'))
const sports = ['basketball', 'handball', 'hockey', 'soccer']

/**
 * Завантаження даних для вибраного виду спорту
 */
function loadSportData() {
	return new Promise(function(resolve, reject) {
		const prev = document.getElementById('loadedScipt')
		if (prev) prev.parentNode.removeChild(prev)

		inp_sport.value = inp_sport_vis.value = sport

		var scriptElement = document.createElement('script')
		scriptElement.id = 'loadedScipt'
		scriptElement.src = 'js/data.' + sport + '.js'
		document.head.appendChild(scriptElement)

		document.querySelectorAll('[data-playoff]').forEach(el => {
			el.hidden = sport === 'soccer'
		})

		scriptElement.onload = () => {
			inp_season_max.value = inp_season_min.max = inp_season_max.max = inp_season_max.dataset.default = season_max
			// ~~~~~~~~~~~~~~~~~~~~
			winnercountries.innerHTML = '<option value="-1">— Усі країни —</option>'
			winnercountries.forEach((country, id) => {
				const option = document.createElement('option') 
				option.value = country.id
				option.textContent = country.name
				inp_country.appendChild(option)
			})
			inp_country.value = 30
			navbar.style.background = sportcolor
			updateHistoryTable()
			resolve()
		}
	}) 
}

form_sport.addEventListener('submit', e => {
	e.preventDefault()
	sport = inp_sport_vis.value
	if (!sports.includes(sport)) sport = sports[0]
	loadSportData().then(() => {
		form_filter.dispatchEvent(new Event('submit'))
	})
})


// ~~~~~~~~~~~~~~~~~~~~
function submitFilter(e) {
	e.preventDefault()

	const formData = new FormData(form_filter)

	const filteredEntries = Array.from(formData.entries()).filter(([name, value]) => {
		const input = document.querySelector(`[name="${name}"]`)
		return input && input.dataset.default !== value
	})

	let url = window.location.origin + window.location.pathname + '?' + new URLSearchParams(filteredEntries).toString()

	history.pushState(null, null, url)

	updateTable()
	updateEraserVisibility()
}

// ~~~~~~~~~~~~~~~~~~~~
form_filter.addEventListener('submit', submitFilter)
document.querySelectorAll('[data-submit]').forEach(el => {
	el.addEventListener('change', e => e.target.form.dispatchEvent(new Event('submit')))
})
btn_filter_erase.addEventListener('click', e => {
	form_filter.querySelectorAll('[data-default]').forEach(el => {
		el.value = el.dataset.default
	})
	form_filter.dispatchEvent(new Event('submit'))
})

function updateEraserVisibility() {
	const formData = new FormData(form_filter)

	const filteredEntries = Array.from(formData.entries()).filter(([name, value]) => {
		const input = document.querySelector(`[name="${name}"]`)
		return input && input.hasAttribute('data-default') && input.dataset.default !== value
	})

	const query = new URLSearchParams(filteredEntries)
	btn_filter_erase.hidden = !query.size
}

// ~~~~~~~~~~~~~~~~~~~~
let sport = urlParams.get('sport')
if (!sports.includes(sport)) sport = sports[0]
loadSportData().then(() => {
	updateTable()
	updateEraserVisibility()
})


// ~~~~~~~~~~~~~~~~~~~~
function updateTable() {
	let cou_id = parseInt(inp_country.value)
	const tou_id = inp_tournament.value
	const status = inp_status.value
	const smin = parseInt(inp_season_min.value)
	const smax = parseInt(inp_season_max.value)

	const tou_ids = tou_id.split('-').map(numString => +numString)

	// ~~~~~~~~~~~~~~~~~~~~
	if (!cou_id) {
		cou_id = inp_country.value = 30
	}

	// ~~~~~~~~~~~~~~~~~~~~
	const result = []
	Object.entries(teams).forEach(([team_id, team]) => {
		if (cou_id > 0 && cou_id != team.cou_id) return
		if (status !== '' && status != team.is_active) return

		team_id = parseInt(team_id)

		const record = {
			team_id: team_id,
			name: team.name,
			cou_id: team.cou_id,
			titles: 0,
		}

		winners.forEach(winner => {
			if (smin && winner.season < smin) return
			if (smax && winner.season > smax) return
			if (winner.team_id === team_id && (!tou_id || tou_ids.includes(winner.tou_id))) record.titles++ 
		})

		result.push(record)
	})
	result.sort((a, b) => b.titles - a.titles)

	// ~~~~~~~~~~~~~~~~~~~~
	const frag = document.createDocumentFragment()
	result.forEach((record, i) => {
		if (!record.titles) return 
		const tr = document.createElement('tr')
		const td0 = document.createElement('td')
		td0.classList.add('text-end')
		td0.textContent = i + 1
		tr.appendChild(td0)
		const td_name = document.createElement('td')
		td_name.textContent = record.name
		td_name.dataset.teamId = record.team_id
		tr.appendChild(td_name)
		const td_country = document.createElement('td')
		td_country.textContent = countries[record.cou_id]
		tr.appendChild(td_country)
		const td_titles = document.createElement('td')
		td_titles.classList.add('text-end')
		td_titles.textContent = record.titles
		tr.appendChild(td_titles)
		frag.appendChild(tr)
	})

	if (!frag.children.length) {
		const tr = document.createElement('tr')
		const td0 = document.createElement('td')
		td0.classList.add('text-center', 'text-danger')
		td0.style.fontStyle = 'italic'
		td0.textContent = 'Нічого не знайдено'
		td0.colSpan = 4
		tr.appendChild(td0)
		frag.appendChild(tr)
	}

	// ~~~~~~~~~~~~~~~~~~~~
	tbody_titles.replaceChildren(frag)
}


/**
 * Переможці по сезонах
 */
function updateHistoryTable() {
	const frag = document.createDocumentFragment()

	for (let season = season_max; season > 0; season--) {
		const tr = document.createElement('tr')
		// ~~~~~~~~~~~~~~~~~~~~
		const td_season = document.createElement('td')
		td_season.classList.add('text-end')
		td_season.textContent = season
		tr.appendChild(td_season)
		// ~~~~~~~~~~~~~~~~~~~~
		for (let tou_id = 1; tou_id < 6; tou_id++) {
			if (tou_id === 2 && sport === 'soccer') continue
			const td = document.createElement('td')
			const team_id = findWinner(season, tou_id < 4 ? 30 : null, tou_id)
			if (team_id) {
				td.textContent = teams[team_id].name
				td.dataset.teamId = team_id
				if (teams[team_id].cou_id !== 30)
					td.classList.add('text-muted')
				else if (teams[team_id].cou_id === 30 && tou_id > 3)
					td.classList.add('fw-bolder')
			}
			tr.appendChild(td)
		}
		// ~~~~~~~~~~~~~~~~~~~~
		frag.appendChild(tr)
	}

	tbody_history.replaceChildren(frag)
}


function findWinner(season, cou_id, tou_id) {
	const winner = winners.find(winner => 
		winner.season === season && 
		winner.cou_id === cou_id && 
		winner.tou_id === tou_id
	)
	return winner ? winner.team_id : null
}

main.addEventListener('mouseover', e => {
	if (e.target.matches('[data-team-id]')) {
		const teamId = e.target.dataset.teamId
		document.querySelectorAll(`[data-team-id="${teamId}"]`).forEach(cell => {
			cell.style.backgroundColor = 'yellow'
		})
	}
})

main.addEventListener('mouseout', e => {
	if (e.target.matches('[data-team-id]')) {
		const teamId = e.target.dataset.teamId
		document.querySelectorAll(`[data-team-id="${teamId}"]`).forEach(cell => {
			cell.style.backgroundColor = ''
		})
	}
})
