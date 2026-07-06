import Card from '@/components/Card'

const CARD_VARIANTS = [
  { id: 'back', faceDown: true },
  { id: 'red-0', color: 'red', type: 'number', value: 0 },
  { id: 'blue-7', color: 'blue', type: 'number', value: 7 },
  { id: 'yellow-skip', color: 'yellow', type: 'skip' },
  { id: 'green-reverse', color: 'green', type: 'reverse' },
  { id: 'red-draw2', color: 'red', type: 'draw2' },
  { id: 'wild', color: 'wild', type: 'wild' },
  { id: 'wild-draw3', color: 'wild', type: 'wild_draw3' },
  { id: 'wild-draw4', color: 'wild', type: 'wild_draw4' },
  { id: 'selected', color: 'blue', type: 'number', value: 4, selected: true },
  {
    id: 'unplayable',
    color: 'green',
    type: 'number',
    value: 9,
    playable: false,
  },
]

const meta = {
  title: 'Components/Card',
  component: Card,
}

export default meta

export const AllVariants = {
  render: () => (
    <div className="min-h-screen bg-[#2f3b35] p-10">
      <div className="flex flex-wrap items-center gap-8">
        {CARD_VARIANTS.map(({ id, ...props }) => (
          <Card key={id} {...props} />
        ))}
      </div>
    </div>
  ),
}

export const Playground = {
  args: {
    color: 'red',
    type: 'number',
    value: 5,
    faceDown: false,
    playable: true,
    selected: false,
  },
  argTypes: {
    color: {
      control: 'select',
      options: ['red', 'blue', 'yellow', 'green', 'wild'],
    },
    type: {
      control: 'select',
      options: [
        'number',
        'skip',
        'reverse',
        'draw2',
        'wild',
        'wild_draw3',
        'wild_draw4',
      ],
    },
  },
  render: (args) => (
    <div className="min-h-screen bg-[#2f3b35] p-10">
      <Card {...args} />
    </div>
  ),
}
