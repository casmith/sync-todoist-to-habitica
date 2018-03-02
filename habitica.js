'use	strict';

const	request	=	require('request');

module.exports	=	class	{

				constructor	(apiUser,	apiKey)	{
								this.apiUser	=	apiUser;
								this.apiKey	=	apiKey;
				}

				createTask	(task)	{
								return	new	Promise((resolve,	reject)	=>	{
												request.post({
																url:	'https://habitica.com/api/v3/tasks/user',
																headers:	{
																				['x-api-user']:	this.apiUser,
																				['x-api-key']:	this.apiKey
																},	
																form:	{
																				type:	'todo',
																				text:	task.content,
																				alias:	task.alias,
																				priority:	task.priority
																}
												},	(err,	res)	=>	{
																if	(err)	{
																				reject(err);
																}	else	{
																				resolve(JSON.parse(res.body));
																}
												});	
								});

				}

}