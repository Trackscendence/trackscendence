import { useState } from 'react'
import Button from '@/components/Button'
import Input from '@/components/Input'

const SORT_OPTIONS = [
  { value: 'wins', label: 'Wins' },
  { value: 'totalScore', label: 'Total score' },
  { value: 'gamesPlayed', label: 'Games played' },
  { value: 'winRate', label: 'Win rate' },
]

const ORDER_OPTIONS = [
  { value: 'desc', label: 'High to low' },
  { value: 'asc', label: 'Low to high' },
]

const selectClassName =
  'mt-2 w-full rounded-md border border-black bg-white px-3 py-2 text-base transition outline-none focus:border-[#0196FF] focus:ring-2 focus:ring-[#0196FF]/20'

const labelClassName = 'text-xs font-semibold text-[#7a3810]'

const LeaderboardFilters = ({ defaultValues, isSubmitting, onApply }) => {
  const [form, setForm] = useState(defaultValues)

  const handleChange = (field) => (event) => {
    setForm((previousForm) => ({
      ...previousForm,
      [field]: event.target.value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onApply({ ...form, search: form.search.trim() })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
    >
      <label className={labelClassName}>
        Search players
        <Input
          value={form.search}
          onChange={handleChange('search')}
          maxLength={50}
          placeholder="Username or display name"
        />
      </label>

      <label className={labelClassName}>
        Min. games
        <Input
          type="number"
          min={0}
          value={form.minGames}
          onChange={handleChange('minGames')}
          placeholder="0"
        />
      </label>

      <label className={labelClassName}>
        Sort by
        <select
          value={form.sort}
          onChange={handleChange('sort')}
          className={selectClassName}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClassName}>
        Order
        <select
          value={form.order}
          onChange={handleChange('order')}
          className={selectClassName}
        >
          {ORDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <Button type="submit" variant="orange" disabled={isSubmitting}>
        Apply
      </Button>
    </form>
  )
}

export default LeaderboardFilters
