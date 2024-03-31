const 	inp_country 	= document.getElementById('select-cou'),
		inp_tournament 	= document.getElementById('select-tou'),
		inp_status 		= document.getElementById('select-status'),
		inp_season_min	= document.getElementById('input-season-min'),
		inp_season_max	= document.getElementById('input-season-max'),
		btn_filter_erase	= document.getElementById('btn-filter-erase'),
		form_filter		= document.getElementById('form-filter'),
		tbody_titles	= document.querySelector('#table-titles tbody')

inp_season_max.value = inp_season_min.max = inp_season_max.max = inp_season_max.dataset.default = season_max
Object.keys(tournaments).forEach(id => {
	const option = document.createElement('option') 
	option.value = id
    option.textContent = tournaments[id]
    inp_tournament.appendChild(option)
})
winnercountries.forEach(country => {
	const option = document.createElement('option') 
	option.value = country.id
    option.textContent = country.name
    inp_country.appendChild(option)
})


/**
 * 
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
	document.querySelectorAll('[data-submit]').forEach(el => {
		el.value = el.dataset.default
	})
	form_filter.dispatchEvent(new Event('submit'))
})

function updateEraserVisibility() {
	const formData = new FormData(form_filter)

	const filteredEntries = Array.from(formData.entries()).filter(([name, value]) => {
		const input = document.querySelector(`[name="${name}"]`)
		return input && input.dataset.default !== value
	})

	const query = new URLSearchParams(filteredEntries)
	btn_filter_erase.hidden = !query.size
}

// ~~~~~~~~~~~~~~~~~~~~
const urlParams = new URLSearchParams(window.location.search)
setValueForSelect(inp_country, urlParams.get('cou')??30)
setValueForSelect(inp_tournament, urlParams.get('tou'))
setValueForSelect(inp_status, urlParams.get('status'))
setValueForNumericInput(inp_season_min, urlParams.get('smin'))
setValueForNumericInput(inp_season_max, urlParams.get('smax'))

updateTable()
updateEraserVisibility()


// ~~~~~~~~~~~~~~~~~~~~
function getCountryNameById(id) {
	const country = countries.find(country => country.id === id)
	return country ? country.name : null
}

// ~~~~~~~~~~~~~~~~~~~~
function updateTable() {
	let cou_id = parseInt(inp_country.value)
	const tou_id = parseInt(inp_tournament.value)
	const status = inp_status.value
	const smin = parseInt(inp_season_min.value)
	const smax = parseInt(inp_season_max.value)

	// ~~~~~~~~~~~~~~~~~~~~
	if ([1, 2, 3].includes(tou_id)) {
		cou_id = inp_country.value = 30
	}

	// ~~~~~~~~~~~~~~~~~~~~
	const result = [];
	teams.forEach(team => {
		if (cou_id > 0 && cou_id != team.cou_id) return
		if (status !== '' && status != team.is_active) return

		const record = {
			team_id: team.id,
			name: team.name,
			cou_id: team.cou_id,
			titles: 0,
		}

		winners.forEach(winner => {
			if (smin && winner.season < smin) return
			if (smax && winner.season > smax) return
			if (winner.team_id === team.id && (!tou_id || tou_id == winner.tou_id)) record.titles++ 
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
		tr.appendChild(td_name)
		const td_country = document.createElement('td')
		td_country.textContent = getCountryNameById(record.cou_id)
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
