export default function Heading({ title, subtitle = "" }) {
	return (
		<div>
			<h1 className="text-3xl font-bold text-gray-900 font-pj">{title}</h1>
			<p className="text-base font-normal leading-7 text-gray-600">
				{subtitle}
			</p>
		</div>
	);
}
