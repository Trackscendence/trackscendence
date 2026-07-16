import { useState } from 'react'
import Button from '@/components/Button'
import FormField from '@/components/FormField'
import Input from '@/components/Input'
import useTournamentStore from '@/stores/useTournamentStore'

const TOURNAMENT_SIZES = [4, 8]

// Mirrors the server rules client-side so obvious mistakes never leave the
// modal: a (trimmed) name is required, the bracket holds 4 or 8 players, and
// the prize is a whole number of points, zero or more.
const validate = (form) => {
  const errors = {}
  const prizePoints = Number(form.prizePoints)

  if (!form.name.trim()) {
    errors.name = 'Give the tournament a name'
  }
  if (!TOURNAMENT_SIZES.includes(form.size)) {
    errors.size = 'Pick a bracket size'
  }
  if (
    form.prizePoints === '' ||
    !Number.isInteger(prizePoints) ||
    prizePoints < 0
  ) {
    errors.prizePoints = 'Prize must be a whole number of points, 0 or more'
  }

  return errors
}

const CreateTournamentForm = ({ onSuccess }) => {
  const [form, setForm] = useState({ name: '', size: 4, prizePoints: '0' })
  const [error, setError] = useState('')
  const [validationDetails, setValidationDetails] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    setError('')
    setValidationDetails({})
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const selectSize = (size) => {
    setError('')
    setValidationDetails({})
    setForm((current) => ({ ...current, size }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const errors = validate(form)
    if (Object.keys(errors).length > 0) {
      setValidationDetails(errors)
      return
    }

    setIsSubmitting(true)
    try {
      await useTournamentStore.getState().createTournament({
        name: form.name.trim(),
        size: form.size,
        prizePoints: Number(form.prizePoints),
      })
      onSuccess()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <FormField label="Name">
        <Input
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
        />
        {validationDetails.name ? (
          <p className="mt-1 text-sm text-[#8a321f]">
            {validationDetails.name}
          </p>
        ) : null}
      </FormField>

      <div>
        <p className="text-sm font-medium">Players</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {TOURNAMENT_SIZES.map((size) => (
            <Button
              key={size}
              type="button"
              variant={form.size === size ? 'orange' : 'social'}
              onClick={() => selectSize(size)}
            >
              {size} players
            </Button>
          ))}
        </div>
        {validationDetails.size ? (
          <p className="mt-1 text-sm text-[#8a321f]">
            {validationDetails.size}
          </p>
        ) : null}
      </div>

      <FormField label="Prize points">
        <Input
          inputMode="numeric"
          min="0"
          name="prizePoints"
          step="1"
          type="number"
          value={form.prizePoints}
          onChange={handleChange}
        />
        {validationDetails.prizePoints ? (
          <p className="mt-1 text-sm text-[#8a321f]">
            {validationDetails.prizePoints}
          </p>
        ) : null}
      </FormField>

      {error ? (
        <p className="rounded-md border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">
          {error}
        </p>
      ) : null}

      <Button disabled={isSubmitting} type="submit" variant="orange">
        {isSubmitting ? 'Creating tournament' : 'Create tournament'}
      </Button>
    </form>
  )
}

export default CreateTournamentForm
