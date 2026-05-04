from setuptools import find_packages, setup

with open("README.md", encoding="utf-8") as f:
	long_description = f.read()

setup(
	name="shivanand_consulting",
	version="1.0.0",
	description="Personal consulting website for shivanandbanahatti.com",
	long_description=long_description,
	author="ATHRU Technologies Private Limited",
	author_email="contact@athrutec.com",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	python_requires=">=3.10",
)
